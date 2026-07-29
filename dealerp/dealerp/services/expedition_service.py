import frappe

from dealerp.dealerp.kpi.calculation import (
    compute_margin,
    compute_profitability_percent,
    compute_total_cost,
)


def recalculate_expedition(expedition_name: str):
    """
    Recalcule les KPI d'une expédition.
    """

    expedition = frappe.get_doc("Expedition", expedition_name)

    # Récupération des dépenses validées
    expense_rows = frappe.get_all(
        "Expedition Expense",
        filters={
            "expedition": expedition_name,
            "docstatus": 1,
        },
        fields=["montant"],
    )

    expenses = [row.montant for row in expense_rows]

    total_cost = compute_total_cost(expenses)

    # À implémenter plus tard
    invoiced_revenue = 0

    actual_margin = compute_margin(invoiced_revenue, total_cost)

    profitability = compute_profitability_percent(
        actual_margin,
        invoiced_revenue,
    )

    frappe.logger().info(
        f"[DealERP] Expedition={expedition.name} "
        f"Cost={total_cost} "
        f"Revenue={invoiced_revenue} "
        f"Margin={actual_margin} "
        f"Profitability={profitability}%"
    )






































