import frappe


def get_or_create_dossier(
    *,
    customer=None,
    company=None,
    owner_user=None,
    quotation=None,
    sales_order=None,
    expedition=None,
    description=None,
):
    """Retourne un Dossier existant ou en crée un nouveau.

    Une seule fonction centrale est utilisée par les différents
    points d'entrée métier de DealERP.
    """

    # 1. Si une expédition est déjà rattachée à un dossier,
    #    celui-ci est prioritaire.
    if expedition:
        existing_dossier = frappe.db.get_value(
            "Expedition",
            expedition,
            "deal_dossier",
        )

        if existing_dossier:
            return frappe.get_doc("Dossier", existing_dossier)

    # 2. Si un Sales Order est fourni, chercher le dossier associé.
    if sales_order:
        existing_dossier = frappe.db.get_value(
            "Dossier",
            {"sales_order": sales_order},
            "name",
        )

        if existing_dossier:
            return frappe.get_doc("Dossier", existing_dossier)

    # 3. Si un Quotation est fourni, chercher le dossier associé.
    if quotation:
        existing_dossier = frappe.db.get_value(
            "Dossier",
            {"quotation": quotation},
            "name",
        )

        if existing_dossier:
            return frappe.get_doc("Dossier", existing_dossier)

    # 4. Aucun dossier trouvé : création.
    dossier = frappe.get_doc({
        "doctype": "Dossier",
        "customer": customer,
        "company": company,
        "owner_user": owner_user,
        "quotation": quotation,
        "sales_order": sales_order,
        "description": description,
    })

    dossier.insert(ignore_permissions=True)

    # 5. Si l'origine est une Expédition,
    #    conserver le lien Expédition → Dossier.
    if expedition:
        frappe.db.set_value(
            "Expedition",
            expedition,
            "deal_dossier",
            dossier.name,
        )

    return dossier


@frappe.whitelist()
def get_dossier_dashboard(dossier_name):
    """Retourne les données consolidées du dashboard d'un Dossier."""

    dossier = frappe.get_doc("Dossier", dossier_name)

    # ------------------------------------------------------------------
    # EXPEDITIONS
    # ------------------------------------------------------------------
    expeditions = frappe.get_all(
        "Expedition",
        filters={
            "deal_dossier": dossier_name
        },
        fields=[
            "name",
            "operation_type",
            "mode_transport",
            "invoiced_revenue",
            "total_cost",
            "actual_margin",
            "profitability_percent",
        ],
        order_by="creation asc",
    )

    # ------------------------------------------------------------------
    # PRESTATIONS
    # ------------------------------------------------------------------
    prestations = frappe.get_all(
        "Prestation",
        filters={
            "dossier": dossier_name
        },
        fields=[
            "name",
            "prestation_type",
            "expedition",
            "status",
            "priority",
            "responsable",
            "date_debut",
            "date_echeance",
            "total_cost",
            "invoiced_revenue",
            "actual_margin",
            "profitability_percent",
        ],
        order_by="creation asc",
    )

    # Libellé métier du type de prestation
    for prestation in prestations:
        prestation["prestation_type_name"] = (
            frappe.db.get_value(
                "Prestation Type",
                prestation.prestation_type,
                "prestation_type_name",
            )
            or prestation.prestation_type
        )

    # ------------------------------------------------------------------
    # TACHES
    # ------------------------------------------------------------------
    tasks = frappe.get_all(
        "Task",
        filters={
            "custom_dossier": dossier_name
        },
        fields=[
            "name",
            "subject",
            "custom_prestation",
            "status",
            "priority",
            "progress",
            "exp_start_date",
            "exp_end_date",
            "completed_by",
            "completed_on",
        ],
        order_by="creation asc",
    )

    # Ajouter le nom lisible de la prestation à chaque tâche.
    prestation_names = {
        prestation.name: prestation.prestation_type_name
        for prestation in prestations
    }

    for task in tasks:
        task["prestation_name"] = prestation_names.get(
            task.custom_prestation,
            task.custom_prestation,
        )

    # ------------------------------------------------------------------
    # AVANCEMENT DES PRESTATIONS
    # ------------------------------------------------------------------

    # Les tâches sont regroupées par prestation afin de calculer
    # l'avancement réel de chaque prestation.
    prestation_task_stats = {}

    for task in tasks:
        if task.status == "Template":
            continue

        prestation_name = task.custom_prestation

        if not prestation_name:
            continue

        if prestation_name not in prestation_task_stats:
            prestation_task_stats[prestation_name] = {
                "count": 0,
                "completed": 0,
                "overdue": 0,
                "progress": 0,
            }

        stats = prestation_task_stats[prestation_name]

        stats["count"] += 1
        stats["progress"] += float(task.progress or 0)

        if task.status == "Completed":
            stats["completed"] += 1

        if task.status == "Overdue":
            stats["overdue"] += 1

    for prestation in prestations:
        stats = prestation_task_stats.get(
            prestation.name,
            {
                "count": 0,
                "completed": 0,
                "overdue": 0,
                "progress": 0,
            },
        )

        prestation["task_count"] = stats["count"]
        prestation["completed_task_count"] = stats["completed"]
        prestation["overdue_task_count"] = stats["overdue"]

        if stats["count"]:
            prestation["task_progress"] = round(
                stats["progress"] / stats["count"],
                2,
            )
        else:
            prestation["task_progress"] = 0

    # Les tâches Template ne doivent pas entrer dans l'avancement réel.
    real_tasks = [
        task for task in tasks
        if task.status != "Template"
    ]

    task_count = len(real_tasks)
    completed_task_count = sum(
        1 for task in real_tasks
        if task.status == "Completed"
    )
    overdue_task_count = sum(
        1 for task in real_tasks
        if task.status == "Overdue"
    )

    if task_count:
        task_progress = round(
            sum(float(task.progress or 0) for task in real_tasks)
            / task_count,
            2,
        )
    else:
        task_progress = 0

    # ------------------------------------------------------------------
    # FACTURES CLIENTS
    # ------------------------------------------------------------------

    sales_invoices = frappe.get_all(
        "Sales Invoice",
        filters={
            "custom_dossier": dossier_name,
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

    # ------------------------------------------------------------------
    # FACTURES FOURNISSEURS
    # ------------------------------------------------------------------

    purchase_invoices = frappe.get_all(
        "Purchase Invoice",
        filters={
            "custom_dossier": dossier_name,
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

    # ------------------------------------------------------------------
    # REGLEMENTS
    # ------------------------------------------------------------------
    #
    # Un Payment Entry n'a pas forcément de Dossier directement.
    # Le rattachement se fait par :
    #
    # Payment Entry
    #       ↓
    # Payment Entry Reference
    #       ↓
    # Sales/Purchase Invoice
    #       ↓
    # custom_dossier
    #

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
            AND si.custom_dossier = %s

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
            AND pi.custom_dossier = %s

        ORDER BY posting_date ASC, name ASC
        """,
        (dossier_name, dossier_name),
        as_dict=True,
    )

    # ------------------------------------------------------------------
    # KPI FINANCIERS
    # ------------------------------------------------------------------
    #
    # IMPORTANT :
    # Les KPI financiers du Dossier sont désormais calculés par
    # dossier_financial_service.py puis stockés directement dans le Dossier.
    #
    # On ne doit donc PAS les recalculer à partir des seules Expéditions,
    # car un Dossier peut également contenir des Prestations et des
    # factures directement rattachées à ces Prestations.
    #
    invoiced_revenue = float(
        dossier.get("invoiced_revenue") or 0
    )

    collected_revenue = float(
        dossier.get("collected_revenue") or 0
    )

    outstanding_revenue = float(
        dossier.get("outstanding_revenue") or 0
    )

    total_cost = float(
        dossier.get("total_cost") or 0
    )

    paid_cost = float(
        dossier.get("paid_cost") or 0
    )

    outstanding_cost = float(
        dossier.get("outstanding_cost") or 0
    )

    actual_margin = float(
        dossier.get("actual_margin") or 0
    )

    profitability_percent = float(
        dossier.get("profitability_percent") or 0
    )

    sales_invoice_count = int(
        dossier.get("sales_invoice_count") or 0
    )

    purchase_invoice_count = int(
        dossier.get("purchase_invoice_count") or 0
    )

    return {
        "dossier": {
            "name": dossier.name,
            "dossier_number": dossier.get("dossier_number"),
            "workflow_state": dossier.get("workflow_state"),
            "customer": dossier.get("customer"),
            "company": dossier.get("company"),
            "type_de_dossier": dossier.get("type_de_dossier"),
            "owner_user": dossier.get("owner_user"),
            "customer_reference": dossier.get("customer_reference"),
            "internal_reference": dossier.get("internal_reference"),
            "description": dossier.get("description"),
            "priority": dossier.get("priority"),
            "quotation": dossier.get("quotation"),
            "sales_order": dossier.get("sales_order"),
        },

        "kpi": {
            "expedition_count": len(expeditions),
            "prestation_count": len(prestations),
            "task_count": task_count,
            "completed_task_count": completed_task_count,
            "overdue_task_count": overdue_task_count,
            "task_progress": task_progress,
            "invoiced_revenue": invoiced_revenue,
            "collected_revenue": collected_revenue,
            "outstanding_revenue": outstanding_revenue,
            "total_cost": total_cost,
            "paid_cost": paid_cost,
            "outstanding_cost": outstanding_cost,
            "actual_margin": actual_margin,
            "profitability_percent": profitability_percent,
            "sales_invoice_count": sales_invoice_count,
            "purchase_invoice_count": purchase_invoice_count,
        },

        "expeditions": expeditions,
        "prestations": prestations,
        "tasks": tasks,
        "sales_invoices": sales_invoices,
        "purchase_invoices": purchase_invoices,
        "payments": payments,
    }
