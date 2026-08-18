frappe.ui.form.on("Prestation", {
    refresh(frm) {

        if (frm.is_new()) {
            return;
        }

        frm.set_df_property("dossier", "read_only", 1);
        frm.set_df_property("custom_client", "read_only", 1);

        // --------------------------------------------------
        // FINANCE
        // --------------------------------------------------

        frm.add_custom_button(__("Facture Client"), () => {

            if (!frm.doc.dossier) {
                frappe.msgprint(
                    __("Cette prestation n'est rattachée à aucun Dossier.")
                );
                return;
            }

            frappe.new_doc("Sales Invoice", {
                customer: frm.doc.custom_client,
                custom_dossier: frm.doc.dossier,
                custom_prestation: frm.doc.name
            });

        }, __("Finance"));


        frm.add_custom_button(__("Facture Fournisseur"), () => {

            if (!frm.doc.dossier) {
                frappe.msgprint(
                    __("Cette prestation n'est rattachée à aucun Dossier.")
                );
                return;
            }

            frappe.new_doc("Purchase Invoice", {
                custom_dossier: frm.doc.dossier,
                custom_prestation: frm.doc.name
            });

        }, __("Finance"));


        // --------------------------------------------------
        // DONNÉES FINANCIÈRES
        // --------------------------------------------------

        if (!frm.fields_dict.financial_dashboard_html) {
            return;
        }

        frappe.call({
            method:
                "dealerp.services.prestation_service.get_financial_details",

            args: {
                prestation_name: frm.doc.name
            },

            callback(r) {

                if (!r.message) {
                    return;
                }

                const data = r.message;

                const sales_invoices =
                    data.sales_invoices || [];

                const purchase_invoices =
                    data.purchase_invoices || [];

                const payments =
                    data.payments || [];


                // --------------------------------------------------
                // KPI
                // --------------------------------------------------

                const financial_kpis = `
                    <div class="row mb-4 deal-financial-kpis">

                        <div class="col-md-4">
                            <div class="card">
                                <div class="card-body">
                                    <div class="text-muted small">
                                        ${__("CA encaissé")}
                                    </div>

                                    <div class="h4 mb-0">
                                        ${format_currency(
                                            data.collected_revenue || 0
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>


                        <div class="col-md-4">
                            <div class="card">
                                <div class="card-body">
                                    <div class="text-muted small">
                                        ${__("Reste à encaisser")}
                                    </div>

                                    <div class="h4 mb-0">
                                        ${format_currency(
                                            data.outstanding_revenue || 0
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>


                        <div class="col-md-4">
                            <div class="card">
                                <div class="card-body">
                                    <div class="text-muted small">
                                        ${__("Taux d'encaissement")}
                                    </div>

                                    <div class="h4 mb-0">
                                        ${data.collection_percent || 0} %
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                `;


                const dashboard_wrapper =
                    frm.fields_dict.financial_dashboard_html.$wrapper;

                dashboard_wrapper
                    .find(".deal-financial-kpis")
                    .remove();

                dashboard_wrapper
                    .html(financial_kpis);


                // --------------------------------------------------
                // STATUT FACTURE
                // --------------------------------------------------

                const invoice_status = status => {

                    const classes = {
                        Paid: "bg-success",
                        Overdue: "bg-danger",
                        Unpaid: "bg-warning text-dark",
                        Draft: "bg-secondary",
                        Submitted: "bg-info",
                        Cancelled: "bg-danger"
                    };

                    const labels = {
                        Paid: __("Payée"),
                        Overdue: __("Impayée (échéance dépassée)"),
                        Unpaid: __("Impayée"),
                        Draft: __("Brouillon"),
                        Submitted: __("Validée"),
                        Cancelled: __("Annulée")
                    };

                    return `
                        <span class="badge ${
                            classes[status] || "bg-secondary"
                        }">
                            ${labels[status] || __(status || "")}
                        </span>
                    `;
                };


                // --------------------------------------------------
                // TYPE REGLEMENT
                // --------------------------------------------------

                const payment_type = type => {

                    const labels = {
                        Receive: __("Encaissement"),
                        Pay: __("Règlement fournisseur")
                    };

                    return labels[type] || __(type || "");
                };


                // --------------------------------------------------
                // STATUT REGLEMENT
                // --------------------------------------------------

                const payment_status = status => {

                    const labels = {
                        Submitted: __("Validé"),
                        Draft: __("Brouillon"),
                        Cancelled: __("Annulé")
                    };

                    const classes = {
                        Submitted: "bg-success",
                        Draft: "bg-secondary",
                        Cancelled: "bg-danger"
                    };

                    return `
                        <span class="badge ${
                            classes[status] || "bg-secondary"
                        }">
                            ${labels[status] || __(status || "")}
                        </span>
                    `;
                };


                // --------------------------------------------------
                // FACTURES CLIENTS
                // --------------------------------------------------

                let sales = `
                    <h4 class="mt-4">
                        ${__("Factures clients")}
                    </h4>

                    <table class="table table-bordered table-hover table-sm">

                        <thead>
                            <tr>
                                <th>${__("Facture")}</th>
                                <th>${__("Client")}</th>
                                <th>${__("Date")}</th>
                                <th>${__("Échéance")}</th>
                                <th>${__("Montant")}</th>
                                <th>${__("Reste")}</th>
                                <th>${__("Statut")}</th>
                                <th>${__("Action")}</th>
                            </tr>
                        </thead>

                        <tbody>
                `;


                if (!sales_invoices.length) {

                    sales += `
                        <tr>
                            <td colspan="8"
                                class="text-muted text-center">
                                ${__("Aucune facture client")}
                            </td>
                        </tr>
                    `;

                } else {

                    sales_invoices.forEach(row => {

                        sales += `
                            <tr>

                                <td>
                                    <a href="/app/sales-invoice/${row.name}">
                                        ${row.name}
                                    </a>
                                </td>

                                <td>
                                    ${row.customer || ""}
                                </td>

                                <td>
                                    ${frappe.datetime.str_to_user(
                                        row.posting_date
                                    )}
                                </td>

                                <td>
                                    ${
                                        row.due_date
                                            ? frappe.datetime.str_to_user(
                                                row.due_date
                                            )
                                            : "-"
                                    }
                                </td>

                                <td style="text-align:right">
                                    ${format_currency(
                                        row.grand_total || 0
                                    )}
                                </td>

                                <td style="text-align:right">
                                    ${format_currency(
                                        row.outstanding_amount || 0
                                    )}
                                </td>

                                <td>
                                    ${invoice_status(row.status)}
                                </td>

                                <td>
                                    ${
                                        Number(row.outstanding_amount || 0) > 0
                                            ? `
                                                <button
                                                    class="btn btn-primary btn-xs btn-pay-invoice"
                                                    data-name="${row.name}"
                                                    data-type="sales"
                                                >
                                                    ${__("Régler")}
                                                </button>
                                            `
                                            : ""
                                    }
                                </td>

                            </tr>
                        `;
                    });
                }


                sales += `
                        </tbody>

                        <tfoot>
                            <tr style="font-weight:bold;background:#f8f9fa">

                                <td colspan="4">
                                    ${__("TOTAL")}
                                </td>

                                <td style="text-align:right">
                                    ${format_currency(
                                        sales_invoices.reduce(
                                            (total, row) =>
                                                total +
                                                Number(
                                                    row.grand_total || 0
                                                ),
                                            0
                                        )
                                    )}
                                </td>

                                <td style="text-align:right">
                                    ${format_currency(
                                        sales_invoices.reduce(
                                            (total, row) =>
                                                total +
                                                Number(
                                                    row.outstanding_amount || 0
                                                ),
                                            0
                                        )
                                    )}
                                </td>

                                <td></td>

                            </tr>
                        </tfoot>

                    </table>
                `;


                // --------------------------------------------------
                // FACTURES FOURNISSEURS
                // --------------------------------------------------

                let purchase = `
                    <h4 class="mt-4">
                        ${__("Factures fournisseurs")}
                    </h4>

                    <table class="table table-bordered table-hover table-sm">

                        <thead>
                            <tr>
                                <th>${__("Facture")}</th>
                                <th>${__("Fournisseur")}</th>
                                <th>${__("Date")}</th>
                                <th>${__("Échéance")}</th>
                                <th>${__("Montant")}</th>
                                <th>${__("Reste")}</th>
                                <th>${__("Statut")}</th>
                                <th>${__("Action")}</th>
                            </tr>
                        </thead>

                        <tbody>
                `;


                if (!purchase_invoices.length) {

                    purchase += `
                        <tr>
                            <td colspan="8"
                                class="text-muted text-center">
                                ${__("Aucune facture fournisseur")}
                            </td>
                        </tr>
                    `;

                } else {

                    purchase_invoices.forEach(row => {

                        purchase += `
                            <tr>

                                <td>
                                    <a href="/app/purchase-invoice/${row.name}">
                                        ${row.name}
                                    </a>
                                </td>

                                <td>
                                    ${row.supplier || ""}
                                </td>

                                <td>
                                    ${frappe.datetime.str_to_user(
                                        row.posting_date
                                    )}
                                </td>

                                <td>
                                    ${
                                        row.due_date
                                            ? frappe.datetime.str_to_user(
                                                row.due_date
                                            )
                                            : "-"
                                    }
                                </td>

                                <td style="text-align:right">
                                    ${format_currency(
                                        row.grand_total || 0
                                    )}
                                </td>

                                <td style="text-align:right">
                                    ${format_currency(
                                        row.outstanding_amount || 0
                                    )}
                                </td>

                                <td>
                                    ${invoice_status(row.status)}
                                </td>

                                <td>
                                    ${
                                        Number(row.outstanding_amount || 0) > 0
                                            ? `
                                                <button
                                                    class="btn btn-primary btn-xs btn-pay-invoice"
                                                    data-name="${row.name}"
                                                    data-type="purchase"
                                                >
                                                    ${__("Régler")}
                                                </button>
                                            `
                                            : ""
                                    }
                                </td>

                            </tr>
                        `;
                    });
                }


                purchase += `
                        </tbody>

                        <tfoot>
                            <tr style="font-weight:bold;background:#f8f9fa">

                                <td colspan="4">
                                    ${__("TOTAL")}
                                </td>

                                <td style="text-align:right">
                                    ${format_currency(
                                        purchase_invoices.reduce(
                                            (total, row) =>
                                                total +
                                                Number(
                                                    row.grand_total || 0
                                                ),
                                            0
                                        )
                                    )}
                                </td>

                                <td style="text-align:right">
                                    ${format_currency(
                                        purchase_invoices.reduce(
                                            (total, row) =>
                                                total +
                                                Number(
                                                    row.outstanding_amount || 0
                                                ),
                                            0
                                        )
                                    )}
                                </td>

                                <td></td>

                            </tr>
                        </tfoot>

                    </table>
                `;


                // --------------------------------------------------
                // REGLEMENTS
                // --------------------------------------------------

                let payments_html = `
                    <h4 class="mt-4">
                        ${__("Règlements")}
                    </h4>

                    <table class="table table-bordered table-hover table-sm">

                        <thead>
                            <tr>
                                <th>${__("Règlement")}</th>
                                <th>${__("Type")}</th>
                                <th>${__("Tiers")}</th>
                                <th>${__("Facture")}</th>
                                <th>${__("Date")}</th>
                                <th>${__("Montant")}</th>
                                <th>${__("Statut")}</th>
                            </tr>
                        </thead>

                        <tbody>
                `;


                if (!payments.length) {

                    payments_html += `
                        <tr>
                            <td colspan="8"
                                class="text-muted text-center">
                                ${__("Aucun règlement")}
                            </td>
                        </tr>
                    `;

                } else {

                    payments.forEach(row => {

                        const invoice_url =
                            row.reference_doctype === "Sales Invoice"
                                ? `/app/sales-invoice/${row.reference_name}`
                                : `/app/purchase-invoice/${row.reference_name}`;


                        payments_html += `
                            <tr>

                                <td>
                                    <a href="/app/payment-entry/${row.name}">
                                        ${row.name}
                                    </a>
                                </td>

                                <td>
                                    ${payment_type(row.payment_type)}
                                </td>

                                <td>
                                    ${row.party || ""}
                                </td>

                                <td>
                                    <a href="${invoice_url}">
                                        ${row.reference_name}
                                    </a>
                                </td>

                                <td>
                                    ${frappe.datetime.str_to_user(
                                        row.posting_date
                                    )}
                                </td>

                                <td style="text-align:right">
                                    ${format_currency(
                                        row.allocated_amount ||
                                        row.paid_amount ||
                                        0
                                    )}
                                </td>

                                <td>
                                    ${payment_status(row.status)}
                                </td>

                            </tr>
                        `;
                    });
                }


                payments_html += `
                        </tbody>

                        <tfoot>
                            <tr style="font-weight:bold;background:#f8f9fa">

                                <td colspan="5">
                                    ${__("TOTAL")}
                                </td>

                                <td style="text-align:right">
                                    ${format_currency(
                                        payments.reduce(
                                            (total, row) =>
                                                total +
                                                Number(
                                                    row.allocated_amount ||
                                                    row.paid_amount ||
                                                    0
                                                ),
                                            0
                                        )
                                    )}
                                </td>

                                <td></td>

                            </tr>
                        </tfoot>

                    </table>
                `;


                // --------------------------------------------------
                // AFFICHAGE
                // --------------------------------------------------

                dashboard_wrapper.html(
                    financial_kpis +
                    sales +
                    purchase +
                    payments_html
                );

                // ==================================================
                // REGLEMENT DIRECT D'UNE FACTURE
                // ==================================================

                dashboard_wrapper
                    .find(".btn-pay-invoice")
                    .off("click")
                    .on("click", function () {

                        const button = $(this);

                        const invoice_name =
                            button.attr("data-name");

                        const invoice_type =
                            button.attr("data-type");

                        if (!invoice_name || !invoice_type) {
                            frappe.msgprint(
                                __("Impossible d'identifier la facture.")
                            );
                            return;
                        }

                        const doctype =
                            invoice_type === "sales"
                                ? "Sales Invoice"
                                : "Purchase Invoice";

                        // --------------------------------------------------
                        // UTILISER LE MECANISME NATIF ERPNext
                        // --------------------------------------------------

                        frappe.call({
                            method:
                                "erpnext.accounts.doctype.payment_entry.payment_entry.get_payment_entry",

                            args: {
                                dt: doctype,
                                dn: invoice_name
                            },

                            freeze: true,

                            freeze_message:
                                __("Préparation du règlement...")
                        }).then(r => {

                            if (!r.message) {
                                frappe.msgprint(
                                    __("Impossible de préparer le règlement.")
                                );
                                return;
                            }

                            const payment_entry = r.message;

                            // --------------------------------------------------
                            // RATTACHEMENT A LA PRESTATION
                            // --------------------------------------------------

                            payment_entry.custom_prestation =
                                frm.doc.name;

                            // --------------------------------------------------
                            // SYNCHRONISATION ET OUVERTURE
                            // --------------------------------------------------

                            frappe.model.sync(payment_entry);

                            frappe.set_route(
                                "Form",
                                "Payment Entry",
                                payment_entry.name
                            );

                        });

                    });

                }
            });

        },


    dossier(frm) {

        frm.set_value("expedition", null);
        frm.set_value("custom_client", null);

        if (!frm.doc.dossier) {
            return;
        }

        frappe.db.get_value(
            "Dossier",
            frm.doc.dossier,
            [
                "customer",
                "owner_user"
            ]
        ).then(r => {

            if (!r.message) {
                return;
            }

            if (r.message.customer) {
                frm.set_value(
                    "custom_client",
                    r.message.customer
                );
            }

            if (r.message.owner_user) {
                frm.set_value(
                    "responsable",
                    r.message.owner_user
                );
            }
        });

        frm.set_query("expedition", function() {

            return {
                filters: {
                    deal_dossier: frm.doc.dossier
                }
            };

        });
    }
});
