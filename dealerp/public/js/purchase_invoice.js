frappe.ui.form.on("Purchase Invoice", {
    refresh(frm) {
        setup_invoice_reference_logic(frm);
        setup_dossier_queries(frm);
    },

    custom_dossier(frm) {
        clear_invalid_references(frm);
        setup_dossier_queries(frm);
    },

    custom_expedition_shipment(frm) {
        handle_expedition_change(frm);
    },

    custom_prestation(frm) {
        handle_prestation_change(frm);
    }
});


function setup_invoice_reference_logic(frm) {

    const expedition = frm.doc.custom_expedition_shipment;
    const prestation = frm.doc.custom_prestation;

    if (expedition) {

        frm.set_df_property(
            "custom_prestation",
            "read_only",
            1
        );

    } else if (prestation) {

        frm.set_df_property(
            "custom_expedition_shipment",
            "read_only",
            1
        );

    } else {

        frm.set_df_property(
            "custom_expedition_shipment",
            "read_only",
            0
        );

        frm.set_df_property(
            "custom_prestation",
            "read_only",
            0
        );
    }
}


function setup_dossier_queries(frm) {

    frm.set_query("custom_expedition_shipment", function() {

        if (!frm.doc.custom_dossier) {
            return {};
        }

        return {
            filters: {
                deal_dossier: frm.doc.custom_dossier
            }
        };
    });


    frm.set_query("custom_prestation", function() {

        if (!frm.doc.custom_dossier) {
            return {};
        }

        return {
            filters: {
                dossier: frm.doc.custom_dossier
            }
        };
    });
}


function clear_invalid_references(frm) {

    if (!frm.doc.custom_dossier) {
        return;
    }

    if (frm.doc.custom_expedition_shipment) {

        frappe.db.get_value(
            "Expedition",
            frm.doc.custom_expedition_shipment,
            "deal_dossier"
        ).then(r => {

            if (
                r.message &&
                r.message.deal_dossier &&
                r.message.deal_dossier !== frm.doc.custom_dossier
            ) {
                frm.set_value(
                    "custom_expedition_shipment",
                    null
                );
            }
        });
    }


    if (frm.doc.custom_prestation) {

        frappe.db.get_value(
            "Prestation",
            frm.doc.custom_prestation,
            "dossier"
        ).then(r => {

            if (
                r.message &&
                r.message.dossier &&
                r.message.dossier !== frm.doc.custom_dossier
            ) {
                frm.set_value(
                    "custom_prestation",
                    null
                );
            }
        });
    }
}


function handle_expedition_change(frm) {

    if (frm.doc.custom_expedition_shipment) {

        frm.set_df_property(
            "custom_prestation",
            "read_only",
            1
        );

    } else {

        frm.set_df_property(
            "custom_prestation",
            "read_only",
            0
        );
    }
}


function handle_prestation_change(frm) {

    if (frm.doc.custom_prestation) {

        frm.set_df_property(
            "custom_expedition_shipment",
            "read_only",
            1
        );

    } else {

        frm.set_df_property(
            "custom_expedition_shipment",
            "read_only",
            0
        );
    }
}
