frappe.ui.form.on("Expedition", {
    refresh(frm) {

        console.log("=== DEALERP Expedition JS chargé ===");

        if (frm.is_new()) {
            return;
        }

        frm.add_custom_button(__("Facture Client"), () => {
            frappe.new_doc("Sales Invoice", {
                custom_expédition__shipment: frm.doc.name
            });
        }, __("Finance"));

        frm.add_custom_button(__("Facture Fournisseur"), () => {
            frappe.new_doc("Purchase Invoice", {
                custom_expedition_shipment: frm.doc.name
            });
        }, __("Finance"));
    }
});
