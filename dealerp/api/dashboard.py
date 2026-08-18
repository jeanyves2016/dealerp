import frappe
from frappe.utils import flt


@frappe.whitelist()
def get_dashboard_data():

    data = {
        "dossiers": frappe.db.count("Dossier"),
        "expeditions": frappe.db.count("Expedition"),
        "prestations": frappe.db.count("Prestation"),
        "taches": frappe.db.count("Task"),
        "taches_en_retard": frappe.db.count(
            "Task",
            {"status": "Overdue"},
        ),
        "ca": 0,
        "encaissements": 0,
        "impayes": 0,
        "taux_encaissement": 0,
        "dossiers_recents": [],
        "expeditions_recentes": [],
    }

    # =========================================================
    # FINANCE ERPNext
    # =========================================================

    sales = frappe.db.sql("""
        SELECT COALESCE(SUM(base_grand_total), 0)
        FROM `tabSales Invoice`
        WHERE docstatus = 1
    """)

    data["ca"] = flt(sales[0][0]) if sales else 0

    payments = frappe.db.sql("""
        SELECT COALESCE(SUM(base_paid_amount), 0)
        FROM `tabPayment Entry`
        WHERE docstatus = 1
        AND payment_type = 'Receive'
    """)

    data["encaissements"] = flt(payments[0][0]) if payments else 0

    outstanding = frappe.db.sql("""
        SELECT COALESCE(SUM(outstanding_amount), 0)
        FROM `tabSales Invoice`
        WHERE docstatus = 1
        AND outstanding_amount > 0
    """)

    data["impayes"] = flt(outstanding[0][0]) if outstanding else 0

    if data["ca"]:
        data["taux_encaissement"] = round(
            (data["encaissements"] / data["ca"]) * 100,
            1,
        )

    # =========================================================
    # DOSSIERS RECENTS
    # =========================================================

    data["dossiers_recents"] = frappe.get_all(
        "Dossier",
        fields=[
            "name",
            "customer",
            "company",
            "owner_user",
            "priority",
            "modified",
        ],
        order_by="modified desc",
        limit_page_length=5,
    )

    # =========================================================
    # EXPEDITIONS RECENTES
    # =========================================================

    data["expeditions_recentes"] = frappe.get_all(
        "Expedition",
        fields=[
            "name",
            "custom_client",
            "custom_responsable",
            "operation_type",
            "mode_transport",
            "deal_dossier",
            "modified",
        ],
        order_by="modified desc",
        limit_page_length=5,
    )


    # ---------------------------------------------------------
    # EVOLUTION FINANCIERE - 6 DERNIERS MOIS
    # ---------------------------------------------------------

    monthly = frappe.db.sql("""
        SELECT
            DATE_FORMAT(posting_date, '%Y-%m') AS month,
            COALESCE(SUM(base_grand_total), 0) AS ca
        FROM `tabSales Invoice`
        WHERE docstatus = 1
          AND posting_date >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
        GROUP BY DATE_FORMAT(posting_date, '%Y-%m')
        ORDER BY month
    """, as_dict=True)

    monthly_payments = frappe.db.sql("""
        SELECT
            DATE_FORMAT(posting_date, '%Y-%m') AS month,
            COALESCE(SUM(paid_amount), 0) AS encaissements
        FROM `tabPayment Entry`
        WHERE docstatus = 1
          AND payment_type = 'Receive'
          AND posting_date >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
        GROUP BY DATE_FORMAT(posting_date, '%Y-%m')
        ORDER BY month
    """, as_dict=True)

    payment_map = {
        row.month: float(row.encaissements or 0)
        for row in monthly_payments
    }

    ca_map = {
        row.month: float(row.ca or 0)
        for row in monthly
    }

    from datetime import date
    from dateutil.relativedelta import relativedelta

    current_month = date.today().replace(day=1)

    data["evolution_financiere"] = []

    for i in range(5, -1, -1):
        month_date = current_month - relativedelta(months=i)
        month_key = month_date.strftime("%Y-%m")

        data["evolution_financiere"].append({
            "mois": month_key,
            "ca": ca_map.get(month_key, 0),
            "encaissements": payment_map.get(month_key, 0)
        })

    return data
