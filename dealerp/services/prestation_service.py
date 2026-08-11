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
