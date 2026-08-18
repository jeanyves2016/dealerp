frappe.ui.form.on("Sales Invoice", {
    refresh(frm) {
        update_invoice_reference_state(frm);
        add_honoraires_button(frm);
    },

    custom_expedition_shipment(frm) {
        update_invoice_reference_state(frm);
        add_honoraires_button(frm);
    },

    custom_prestation(frm) {
        update_invoice_reference_state(frm);
        add_honoraires_button(frm);
    }
});


function update_invoice_reference_state(frm) {

    const expedition = frm.doc.custom_expedition_shipment;
    const prestation = frm.doc.custom_prestation;

    if (expedition && !prestation) {

        frm.toggle_enable("custom_expedition_shipment", true);
        frm.toggle_enable("custom_prestation", false);

    } else if (prestation && !expedition) {

        frm.toggle_enable("custom_expedition_shipment", false);
        frm.toggle_enable("custom_prestation", true);

    } else {

        frm.toggle_enable("custom_expedition_shipment", true);
        frm.toggle_enable("custom_prestation", true);
    }
}


function add_honoraires_button(frm) {

    if (frm.is_new() || frm.doc.docstatus !== 0) {
        return;
    }

    frm.remove_custom_button("Calculer les honoraires");

    if (
        !frm.doc.custom_prestation &&
        !frm.doc.custom_expedition_shipment
    ) {
        return;
    }

    frm.add_custom_button(
        "Calculer les honoraires",
        function () {

            let base_type = null;
            let base_name = null;

            if (frm.doc.custom_prestation) {
                base_type = "Prestation";
                base_name = frm.doc.custom_prestation;
            }

            if (frm.doc.custom_expedition_shipment) {
                base_type = "Expédition";
                base_name = frm.doc.custom_expedition_shipment;
            }

            frappe.call({
                method: "dealerp.services.billing_rule_service.calculate_honoraires",
                args: {
                    base_type: base_type,
                    base_name: base_name
                },
                freeze: true,
                freeze_message: "Calcul des honoraires...",
                callback: function (r) {

                    if (!r.message || !r.message.length) {

                        frappe.msgprint(
                            "Aucun honoraire applicable pour cette référence."
                        );

                        return;
                    }

                    let added = 0;

                    r.message.forEach(function (ligne) {

                        const already_exists = frm.doc.items.some(
                            row => row.item_code === ligne.item_code
                        );

                        if (already_exists) {
                            return;
                        }

                        let row = frm.add_child("items");

                        frappe.model.set_value(
                            row.doctype,
                            row.name,
                            "item_code",
                            ligne.item_code
                        ).then(function () {

                            frappe.model.set_value(
                                row.doctype,
                                row.name,
                                "qty",
                                ligne.qty
                            );

                            frappe.model.set_value(
                                row.doctype,
                                row.name,
                                "rate",
                                ligne.rate
                            );

                            frm.refresh_field("items");
                        });

                        added++;
                    });

                    frm.refresh_field("items");

                    if (added) {
                        frappe.show_alert({
                            message: `${added} honoraire(s) ajouté(s)`,
                            indicator: "green"
                        });
                    } else {
                        frappe.msgprint(
                            "Les honoraires applicables sont déjà présents dans la facture."
                        );
                    }
                }
            });
        }
    );
}
