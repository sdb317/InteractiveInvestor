from django.shortcuts import render
from django.http import HttpResponse

def index(request):
    return HttpResponse("Welcome to the Dashboard")


from .services import StockService
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

@api_view(['GET'])
def list_stocks(request):
    stocks = StockService.list_stocks()
    data = [{"symbol": s.symbol, "company_name": s.company_name, "price": float(s.price), "volume": s.volume, "market_cap": s.market_cap, "last_updated": s.last_updated.isoformat()} for s in stocks]
    return Response(data)

@api_view(['POST'])
def add_stock(request):
    data = request.data
    stock = StockService.add_stock(data)
    return Response({"symbol": stock.symbol, "message": "Stock added successfully"}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
def get_stock(request, symbol):
    stock = StockService.get_stock(symbol)
    if stock:
        return Response({"symbol": stock.symbol, "company_name": stock.company_name, "price": float(stock.price), "volume": stock.volume, "market_cap": stock.market_cap, "last_updated": stock.last_updated.isoformat()})
    return Response({"error": "Stock not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT', 'PATCH'])
def update_stock(request, symbol):
    data = request.data
    stock = StockService.update_stock(symbol, data)
    if stock:
        return Response({"symbol": stock.symbol, "message": "Stock updated successfully"})
    return Response({"error": "Stock not found"}, status=status.HTTP_404_NOT_FOUND)
