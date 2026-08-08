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
