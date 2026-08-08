import frappe
from frappe.utils import add_days


def create_prestation_tasks(prestation_name):
    prestation = frappe.get_doc("Prestation", prestation_name)

    if frappe.db.exists("Task", {"custom_prestation": prestation.name}):
        return

    if not prestation.prestation_type:
        return

    modele = frappe.get_doc("Prestation Type", prestation.prestation_type)

    for row in modele.tasks:
        start_date = prestation.date_debut or frappe.utils.today()

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
            "custom_prestation": prestation.name
        })

        task.insert(ignore_permissions=True)

    frappe.db.commit()
