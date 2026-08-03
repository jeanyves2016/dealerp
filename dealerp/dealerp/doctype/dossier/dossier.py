from frappe.model.document import Document


class Dossier(Document):
    pass


def get_dashboard_data(data):
    data["transactions"] = [
        {
            "label": "Transit",
            "items": [
                "Expedition",
            ],
        }
    ]

    return data
