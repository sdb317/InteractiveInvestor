from .repositories import StockRepository

class StockService:
    @staticmethod
    def list_stocks():
        return StockRepository.get_all()

    @staticmethod
    def get_stock(symbol):
        return StockRepository.get_by_symbol(symbol)

    @staticmethod
    def add_stock(data):
        # Basic validation could be added here
        return StockRepository.create(data)

    @staticmethod
    def update_stock(symbol, data):
        return StockRepository.update(symbol, data)
