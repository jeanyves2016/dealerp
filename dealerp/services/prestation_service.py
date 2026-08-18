import frappe
from frappe.utils import add_days


def create_prestation_tasks(prestation_name):
    prestation = frappe.get_doc("Prestation", prestation_name)

    # Ne pas recréer les tâches si elles existent déjà
    if frappe.db.exists("Task", {"custom_prestation": prestation.name}):
        return

    # Une prestation doit avoir un type pour générer ses tâches
    if not prestation.prestation_type:
        return

    modele = frappe.get_doc(
        "Prestation Type",
        prestation.prestation_type
    )

    start_date = prestation.date_debut or frappe.utils.today()
    previous_task = None

    for row in modele.tasks:
        task = frappe.get_doc({
            "doctype": "Task",
            "subject": row.task_name,
            "description": row.description,
            "priority": row.priority or "Medium",
            "status": "Open",
            "exp_start_date": start_date,
            "exp_end_date": add_days(
                start_date,
                row.expected_days or 0
            ),
            "custom_prestation": prestation.name,
            "custom_dossier": prestation.dossier,
        })

        task.insert(ignore_permissions=True)

        # La tâche courante dépend de la tâche précédente
        if previous_task:
            task.append(
                "depends_on",
                {
                    "task": previous_task.name
                }
            )
            task.save(ignore_permissions=True)

        previous_task = task

    frappe.db.commit()


def recalculate_prestation(prestation_name: str):
    """Recalcule les KPI financiers d'une prestation."""

    prestation = frappe.get_doc("Prestation", prestation_name)

    purchase_total = frappe.db.sql("""
        SELECT COALESCE(SUM(grand_total), 0)
        FROM `tabPurchase Invoice`
        WHERE docstatus = 1
        AND custom_prestation = %s
    """, prestation_name)[0][0]

    sales_total = frappe.db.sql("""
        SELECT COALESCE(SUM(grand_total), 0)
        FROM `tabSales Invoice`
        WHERE docstatus = 1
        AND custom_prestation = %s
    """, prestation_name)[0][0]

    purchase_total = frappe.utils.flt(purchase_total)
    sales_total = frappe.utils.flt(sales_total)

    margin = sales_total - purchase_total

    if sales_total:
        profitability = round(
            margin * 100 / sales_total,
            2,
        )
    else:
        profitability = 0

    prestation.db_set("total_cost", purchase_total)
    prestation.db_set("invoiced_revenue", sales_total)
    prestation.db_set("actual_margin", margin)
    prestation.db_set("profitability_percent", profitability)

    return {
        "purchase_total": purchase_total,
        "sales_total": sales_total,
        "margin": margin,
        "profitability": profitability,
    }


@frappe.whitelist()
def get_financial_details(prestation_name):
    """
    Retourne le détail financier d'une Prestation.

    Parcours :
        Prestation
            -> Factures clients / fournisseurs
            -> Règlements via Payment Entry Reference
    """

    # --------------------------------------------------
    # FACTURES CLIENTS
    # --------------------------------------------------

    sales_invoices = frappe.get_all(
        "Sales Invoice",
        filters={
            "custom_prestation": prestation_name,
            "docstatus": ["!=", 2],
        },
        fields=[
            "name",
            "posting_date",
            "due_date",
            "customer",
            "grand_total",
            "outstanding_amount",
            "status",
            "docstatus",
        ],
        order_by="posting_date asc, creation asc",
    )

    # --------------------------------------------------
    # FACTURES FOURNISSEURS
    # --------------------------------------------------

    purchase_invoices = frappe.get_all(
        "Purchase Invoice",
        filters={
            "custom_prestation": prestation_name,
            "docstatus": ["!=", 2],
        },
        fields=[
            "name",
            "posting_date",
            "due_date",
            "supplier",
            "grand_total",
            "outstanding_amount",
            "status",
            "docstatus",
        ],
        order_by="posting_date asc, creation asc",
    )

    # --------------------------------------------------
    # REGLEMENTS
    #
    # Le rattachement se fait via :
    #
    # Payment Entry
    #       ↓
    # Payment Entry Reference
    #       ↓
    # Sales / Purchase Invoice
    #       ↓
    # custom_prestation
    # --------------------------------------------------

    payments = frappe.db.sql(
        """
        SELECT
            pe.name,
            pe.posting_date,
            pe.payment_type,
            pe.party_type,
            pe.party,
            pe.paid_amount,
            pe.total_allocated_amount,
            pe.status,
            per.reference_doctype,
            per.reference_name,
            per.allocated_amount
        FROM `tabPayment Entry` pe
        INNER JOIN `tabPayment Entry Reference` per
            ON per.parent = pe.name
        INNER JOIN `tabSales Invoice` si
            ON si.name = per.reference_name
        WHERE
            pe.docstatus = 1
            AND per.reference_doctype = 'Sales Invoice'
            AND si.docstatus = 1
            AND si.custom_prestation = %s

        UNION ALL

        SELECT
            pe.name,
            pe.posting_date,
            pe.payment_type,
            pe.party_type,
            pe.party,
            pe.paid_amount,
            pe.total_allocated_amount,
            pe.status,
            per.reference_doctype,
            per.reference_name,
            per.allocated_amount
        FROM `tabPayment Entry` pe
        INNER JOIN `tabPayment Entry Reference` per
            ON per.parent = pe.name
        INNER JOIN `tabPurchase Invoice` pi
            ON pi.name = per.reference_name
        WHERE
            pe.docstatus = 1
            AND per.reference_doctype = 'Purchase Invoice'
            AND pi.docstatus = 1
            AND pi.custom_prestation = %s

        ORDER BY posting_date ASC, name ASC
        """,
        (prestation_name, prestation_name),
        as_dict=True,
    )

    # --------------------------------------------------
    # KPI ENCAISSEMENT CLIENT
    # --------------------------------------------------

    invoiced_revenue = sum(
        frappe.utils.flt(row.grand_total)
        for row in sales_invoices
        if row.docstatus == 1
    )

    outstanding_revenue = sum(
        frappe.utils.flt(row.outstanding_amount)
        for row in sales_invoices
        if row.docstatus == 1
    )

    collected_revenue = (
        invoiced_revenue - outstanding_revenue
    )

    if invoiced_revenue:
        collection_percent = round(
            collected_revenue * 100 / invoiced_revenue,
            2,
        )
    else:
        collection_percent = 0

    return {
        "sales_invoices": sales_invoices,
        "purchase_invoices": purchase_invoices,
        "payments": payments,
        "collected_revenue": collected_revenue,
        "outstanding_revenue": outstanding_revenue,
        "collection_percent": collection_percent,
    }
