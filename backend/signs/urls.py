from django.urls import path

from .views import predict_sign, send_sign_text

urlpatterns = [
    path("predict/", predict_sign, name="predict-sign"),
    path("send-text/", send_sign_text, name="send-sign-text"),
]