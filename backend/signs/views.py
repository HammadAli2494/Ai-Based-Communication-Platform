import json

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .predictor import predict_from_base64


@csrf_exempt
def predict_sign(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=405)

    data = json.loads(request.body)
    image = data.get("image")

    if not image:
        return JsonResponse({"error": "image is required"}, status=400)

    prediction = predict_from_base64(image)
    return JsonResponse(prediction)


@csrf_exempt
def send_sign_text(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=405)

    data = json.loads(request.body)

    room_id = data.get("room_id")
    text = data.get("text")

    if not room_id or not text:
        return JsonResponse({"error": "room_id and text are required"}, status=400)

    channel_layer = get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        f"call_{room_id}",
        {
            "type": "send_signal",
            "message": {
                "type": "sign-text",
                "message": text,
                "source": "ml",
            },
            "sender": "ml-detector",
        },
    )

    return JsonResponse({
        "sent": True,
        "room_id": room_id,
        "text": text,
    })