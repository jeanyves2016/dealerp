import frappe
from frappe.utils import flt


def get_base_amount(rule):
    """Retourne la base financière d'une règle."""

    if rule.base_type == "Prestation":
        if not rule.base_item:
            return 0

        return flt(
            frappe.db.get_value(
                "Prestation",
                rule.base_item,
                "invoiced_revenue"
            )
        )

    if rule.base_type == "Expédition":
        if not rule.base_item:
            return 0

        return flt(
            frappe.db.get_value(
                "Expedition",
                rule.base_item,
                "invoiced_revenue"
            )
        )

    return 0


def calculate_rule(rule):
    """Calcule le montant d'une règle de facturation."""

    base = get_base_amount(rule)

    if rule.calculation_type == "Pourcentage":
        montant = base * flt(rule.percentage) / 100

    elif rule.calculation_type == "Montant fixe":
        montant = flt(rule.fixed_amount)

    else:
        return {
            "ok": False,
            "message": f"Type de calcul inconnu : {rule.calculation_type}"
        }

    if rule.minimum_amount and montant < flt(rule.minimum_amount):
        montant = flt(rule.minimum_amount)

    if rule.maximum_amount and montant > flt(rule.maximum_amount):
        montant = flt(rule.maximum_amount)

    return {
        "ok": True,
        "rule": rule.name,
        "target_item": rule.target_item,
        "base_type": rule.base_type,
        "base_reference": rule.base_item,
        "base": base,
        "percentage": flt(rule.percentage),
        "montant": montant,
    }


def get_billing_rules_for_reference(base_type, base_name):
    """Retourne les règles actives liées à une Prestation ou Expédition."""

    return frappe.get_all(
        "Deal Billing Rule",
        filters={
            "is_active": 1,
            "base_type": base_type,
            "base_item": base_name,
        },
        fields=[
            "name",
            "target_item",
            "calculation_type",
            "base_type",
            "base_item",
            "percentage",
            "fixed_amount",
            "minimum_amount",
            "maximum_amount",
        ],
    )


@frappe.whitelist()
def calculate_honoraires(base_type, base_name):
    """Calcule les honoraires applicables à une Prestation ou Expédition."""

    rules = get_billing_rules_for_reference(
        base_type,
        base_name
    )

    result = []

    for rule_data in rules:
        rule = frappe._dict(rule_data)
        calculation = calculate_rule(rule)

        if calculation.get("ok") and calculation["montant"] > 0:
            result.append({
                "item_code": calculation["target_item"],
                "qty": 1,
                "rate": calculation["montant"],
                "billing_rule": calculation["rule"],
                "base_type": calculation["base_type"],
                "base_reference": calculation["base_reference"],
            })

    return result
