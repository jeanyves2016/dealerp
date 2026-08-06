import frappe


def recalculate_expedition(expedition_name):
    total_cost = frappe.db.sql("""
        SELECT COALESCE(SUM(base_grand_total),0)
        FROM `tabPurchase Invoice`
        WHERE docstatus=1
        AND custom_expedition_shipment=%s
    """, expedition_name)[0][0]

    invoiced_revenue = frappe.db.sql("""
        SELECT COALESCE(SUM(base_grand_total),0)
        FROM `tabSales Invoice`
        WHERE docstatus=1
        AND `custom_expedition_shipment`=%s
    """, expedition_name)[0][0]

    actual_margin = invoiced_revenue - total_cost

    profitability_percent = (
        (actual_margin / invoiced_revenue) * 100
        if invoiced_revenue else 0
    )

    frappe.db.set_value(
        "Expedition",
        expedition_name,
        {
            "total_cost": total_cost,
            "invoiced_revenue": invoiced_revenue,
            "actual_margin": actual_margin,
            "profitability_percent": profitability_percent,
        },
        update_modified=False,
    )
