class StockRepository:
    @staticmethod
    def get_all():
        return list(Stock.objects.all())

    @staticmethod
    def get_by_symbol(symbol):
        return Stock.objects.filter(symbol=symbol).first()

    @staticmethod
    def create(data):
        stock = Stock.objects.create(**data)
        return stock

    @staticmethod
    def update(symbol, data):
        stock = Stock.objects.filter(symbol=symbol).first()
        if stock:
            for key, value in data.items():
                setattr(stock, key, value)
            stock.save()
        return stock
