import frappe
from frappe.utils import flt

from dealerp.dealerp.kpi.calculation import (
    compute_margin,
    compute_profitability_percent,
)


def recalculate_expedition(expedition_name: str):

    expedition = frappe.get_doc("Expedition", expedition_name)

    purchase_total = flt(frappe.db.sql("""
        SELECT COALESCE(SUM(grand_total),0)
        FROM `tabPurchase Invoice`
        WHERE docstatus = 1
        AND custom_expedition_shipment=%s
    """, expedition_name)[0][0])

    sales_total = flt(frappe.db.sql("""
        SELECT COALESCE(SUM(grand_total),0)
        FROM `tabSales Invoice`
        WHERE docstatus = 1
        AND custom_expédition__shipment=%s
    """, expedition_name)[0][0])

    expedition.db_set("total_cost", purchase_total)
    expedition.db_set("invoiced_revenue", sales_total)

    margin = compute_margin(sales_total, purchase_total)
    profitability = compute_profitability_percent(margin, sales_total)

    expedition.db_set("actual_margin", margin)
    expedition.db_set("profitability_percent", profitability)

    return {
        "purchase_total": purchase_total,
        "sales_total": sales_total,
        "margin": margin,
        "profitability": profitability,
    }


@frappe.whitelist()
def get_financial_details(expedition_name):

    purchase_invoices = frappe.get_all(
        "Purchase Invoice",
        filters={
            "docstatus": 1,
            "custom_expedition_shipment": expedition_name,
        },
        fields=[
            "name",
            "supplier",
            "posting_date",
            "grand_total",
            "status",
        ],
        order_by="posting_date desc",
    )

    sales_invoices = frappe.get_all(
        "Sales Invoice",
        filters={
            "docstatus": 1,
            "custom_expédition__shipment": expedition_name,
        },
        fields=[
            "name",
            "customer",
            "posting_date",
            "grand_total",
            "status",
        ],
        order_by="posting_date desc",
    )

    return {
        "purchase_invoices": purchase_invoices,
        "sales_invoices": sales_invoices,
    }
