frappe.ui.form.on("Expedition", {
    refresh(frm) {

        if (frm.is_new()) {
            return;
        }

        // --------------------------------------------------
        // FINANCE
        // --------------------------------------------------

        frm.add_custom_button(__("Facture Client"), () => {

            if (!frm.doc.deal_dossier) {
                frappe.msgprint(
                    __("Cette expédition n'est rattachée à aucun Dossier.")
                );
                return;
            }

            frappe.new_doc("Sales Invoice", {
                customer: frm.doc.custom_client,
                custom_dossier: frm.doc.deal_dossier,
                custom_expedition_shipment: frm.doc.name
            });

        }, __("Finance"));
    }
});
