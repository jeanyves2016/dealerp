"""
Dealerp KPI Calculation Engine

Ce module contient uniquement des fonctions de calcul pures.
Aucun accès à Frappe ou à la base de données n'est autorisé ici.
"""


def compute_margin(revenue: float, cost: float) -> float:
    """
    Calcule la marge.
    """
    return round(revenue - cost, 2)


def compute_profitability_percent(margin: float, revenue: float) -> float:
    """
    Calcule le pourcentage de rentabilité.
    """
    if revenue <= 0:
        return 0.0

    return round((margin / revenue) * 100, 2)


def compute_total_cost(expenses: list[float]) -> float:
    """
    Additionne une liste de coûts.
    """
    return round(sum(expenses), 2)
