import frappe

from dealerp.services.dossier_service import get_or_create_dossier


def get_quotation_from_sales_order(sales_order):
    """Retourne le devis source du Sales Order lorsqu'il est unique."""

    quotation_names = {
        row.prevdoc_docname
        for row in sales_order.items
        if row.prevdoc_docname
    }

    if len(quotation_names) == 1:
        return next(iter(quotation_names))

    return None


def create_or_get_dossier_from_sales_order(sales_order_name):
    """Crée ou récupère le Dossier associé à un Sales Order soumis.

    La fonction est idempotente :
    un même Sales Order ne doit jamais créer plusieurs Dossiers.
    """

    sales_order = frappe.get_doc("Sales Order", sales_order_name)

    # 1. Dossier déjà associé au Sales Order
    existing_dossier = frappe.db.get_value(
        "Dossier",
        {"sales_order": sales_order.name},
        "name",
    )

    if existing_dossier:
        return frappe.get_doc("Dossier", existing_dossier)

    # 2. Identifier le devis source lorsqu'il est unique
    quotation = get_quotation_from_sales_order(sales_order)

    # 3. Si le devis possède déjà un Dossier, le réutiliser
    if quotation:
        quotation_dossier = frappe.db.get_value(
            "Dossier",
            {"quotation": quotation},
            "name",
        )

        if quotation_dossier:
            dossier = frappe.get_doc("Dossier", quotation_dossier)

            dossier.sales_order = sales_order.name
            dossier.save(ignore_permissions=True)

            return dossier

    # 4. Aucun Dossier existant : création
    return get_or_create_dossier(
        customer=sales_order.customer,
        company=sales_order.company,
        quotation=quotation,
        sales_order=sales_order.name,
    )
