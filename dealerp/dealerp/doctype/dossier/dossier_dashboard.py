from frappe import _


def get_data():
    return {
        "fieldname": "deal_dossier",
        "transactions": [
            {
                "label": _("Transit"),
                "items": ["Expedition"]
            }
        ]
    }
