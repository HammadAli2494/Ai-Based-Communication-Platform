import json
from channels.generic.websocket import AsyncWebsocketConsumer


class CallConsumer(AsyncWebsocketConsumer):
    rooms = {}

    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group_name = f"call_{self.room_id}"

        if self.room_id not in CallConsumer.rooms:
            CallConsumer.rooms[self.room_id] = []

        if len(CallConsumer.rooms[self.room_id]) >= 2:
            await self.accept()
            await self.send(text_data=json.dumps({"type": "room-full"}))
            await self.close()
            return

        self.role = "caller" if len(CallConsumer.rooms[self.room_id]) == 0 else "callee"

        CallConsumer.rooms[self.room_id].append(self.channel_name)

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        await self.send(text_data=json.dumps({
            "type": "role",
            "role": self.role,
        }))

        if self.role == "callee":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "send_signal",
                    "message": {"type": "peer-ready"},
                    "sender": self.channel_name,
                },
            )

    async def disconnect(self, close_code):
        if self.room_id in CallConsumer.rooms:
            if self.channel_name in CallConsumer.rooms[self.room_id]:
                CallConsumer.rooms[self.room_id].remove(self.channel_name)

            if not CallConsumer.rooms[self.room_id]:
                del CallConsumer.rooms[self.room_id]

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "send_signal",
                "message": {"type": "peer-left"},
                "sender": self.channel_name,
            },
        )

        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "send_signal",
                "message": data,
                "sender": self.channel_name,
            },
        )

    async def send_signal(self, event):
        if event["sender"] != self.channel_name:
            await self.send(text_data=json.dumps(event["message"]))