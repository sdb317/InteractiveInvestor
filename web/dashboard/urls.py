from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
]
    path(\"stocks/\", views.list_stocks, name=\"list_stocks\"),
    path(\"stocks/add/\", views.add_stock, name=\"add_stock\"),
    path(\"stocks/<str:symbol>\", views.get_stock, name=\"get_stock\"),
    path(\"stocks/<str:symbol>\", views.update_stock, name=\"update_stock\"),


