frappe.ui.form.on("Dossier", {
    refresh(frm) {

        if (frm.is_new()) {
            return;
        }

        // ==================================================
        // ACTIONS DU DOSSIER
        // Les actions de création sont accessibles depuis
        // les sections du dossier et non depuis le bandeau.
        // ==================================================

        frappe.call({
            method: "dealerp.services.dossier_service.get_dossier_dashboard",
            args: {
                dossier_name: frm.doc.name
            },
            callback(r) {

                if (!r.message) {
                    return;
                }

                const data = r.message || {};

                console.log(
                    "[DEALERP DOSSIER] Dashboard reçu :",
                    data
                );

                console.log(
                    "[DEALERP DOSSIER] Factures clients :",
                    (data.sales_invoices || []).length
                );

                console.log(
                    "[DEALERP DOSSIER] Factures fournisseurs :",
                    (data.purchase_invoices || []).length
                );

                console.log(
                    "[DEALERP DOSSIER] Règlements :",
                    (data.payments || []).length
                );

                const kpi = data.kpi;

                const currency = value =>
                    format_currency(value || 0);

                // --------------------------------------------------
                // TRADUCTION DES STATUTS ERPNext
                // --------------------------------------------------

                const invoice_status = status => {

                    const labels = {
                        "Paid": "Payée",
                        "Unpaid": "Impayée",
                        "Overdue": "En retard",
                        "Partly Paid": "Partiellement payée",
                        "Partially Paid": "Partiellement payée",
                        "Cancelled": "Annulée",
                        "Draft": "Brouillon",
                        "Return": "Retour",
                        "Credit Note Issued": "Avoir émis"
                    };

                    const styles = {
                        "Paid": "background:#198754;color:#fff;",
                        "Unpaid": "background:#ffc107;color:#212529;",
                        "Overdue": "background:#dc3545;color:#fff;",
                        "Partly Paid": "background:#fd7e14;color:#fff;",
                        "Partially Paid": "background:#fd7e14;color:#fff;",
                        "Cancelled": "background:#212529;color:#fff;",
                        "Draft": "background:#6c757d;color:#fff;"
                    };

                    const label = labels[status] || status || "-";
                    const style = styles[status] ||
                        "background:#6c757d;color:#fff;";

                    return `
                        <span
                            class="badge"
                            style="${style}"
                        >
                            ${label}
                        </span>
                    `;
                };

                const link = (doctype, name, label) => {
                    if (!name) {
                        return "";
                    }

                    return `
                        <a href="/app/${doctype.toLowerCase().replaceAll(" ", "-")}/${name}">
                            ${label || name}
                        </a>
                    `;
                };

                const status_badge = status => {

                    const styles = {
                        "Completed": "background:#198754;color:#fff;",
                        "Working": "background:#0d6efd;color:#fff;",
                        "Pending Review": "background:#ffc107;color:#212529;",
                        "Overdue": "background:#dc3545;color:#fff;",
                        "Open": "background:#0d6efd;color:#fff;",
                        "Cancelled": "background:#212529;color:#fff;"
                    };

                    const labels = {
                        "Completed": "Terminé",
                        "Working": "En cours",
                        "Pending Review": "En attente",
                        "Overdue": "En retard",
                        "Open": "À faire",
                        "Cancelled": "Annulé",
                        "Template": "Modèle"
                    };

                    return `
                        <span
                            class="badge"
                            style="${styles[status] || "background:#6c757d;color:#fff;"}"
                        >
                            ${labels[status] || status || ""}
                        </span>
                    `;
                };

                const priority_badge = priority => {

                    const styles = {
                        "Low": "background:#6c757d;color:#fff;",
                        "Medium": "background:#0d6efd;color:#fff;",
                        "High": "background:#fd7e14;color:#fff;",
                        "Urgent": "background:#dc3545;color:#fff;"
                    };

                    const labels = {
                        "Low": "Basse",
                        "Medium": "Normale",
                        "High": "Haute",
                        "Urgent": "Urgente"
                    };

                    return `
                        <span
                            class="badge"
                            style="${styles[priority] || "background:#6c757d;color:#fff;"}"
                        >
                            ${labels[priority] || priority || "-"}
                        </span>
                    `;
                };

                // --------------------------------------------------
                // PRESTATIONS
                // --------------------------------------------------

                let prestations_html = "";

                if (!data.prestations.length) {

                    prestations_html = `
                        <div class="text-muted">
                            Aucune prestation rattachée à ce dossier.
                        </div>
                    `;

                } else {

                    prestations_html = `
                        <div class="table-responsive">
                            <table class="table table-bordered table-hover table-sm">
                                <thead>
                                    <tr>
                                        <th>Prestation</th>
                                        <th>Statut</th>
                                        <th>Priorité</th>
                                        <th>Responsable</th>
                                        <th>Début</th>
                                        <th>Échéance</th>
                                    <th style="width:180px">Avancement</th>
                                        <th style="text-align:right">CA</th>
                                        <th style="text-align:right">Coût</th>
                                        <th style="text-align:right">Marge</th>
                                    </tr>
                                </thead>

                                <tbody>
                    `;

                    data.prestations.forEach(row => {

                        prestations_html += `
                            <tr>

                                <td>
                                    ${link(
                                        "Prestation",
                                        row.name,
                                        row.prestation_type_name ||
                                        row.prestation_type ||
                                        row.name
                                    )}
                                </td>

                                <td>
                                    ${row.status || ""}
                                </td>

                                <td>
                                    ${priority_badge(row.priority)}
                                </td>

                                <td>
                                    ${row.responsable || "-"}
                                </td>

                                <td>
                                    ${row.date_debut || "-"}
                                </td>

                                <td>
                                    ${row.date_echeance || "-"}
                                </td>

                            <td>
                                <div style="min-width:150px">

                                    <div style="
                                        display:flex;
                                        justify-content:space-between;
                                        margin-bottom:4px;
                                    ">
                                        <strong>
                                            ${Number(row.task_progress || 0).toFixed(0)}%
                                        </strong>

                                        <small class="text-muted">
                                            ${
                                                row.task_count
                                                    ? `${row.completed_task_count || 0} / ${row.task_count} tâches`
                                                    : "Aucune tâche"
                                            }
                                        </small>
                                    </div>

                                    <div class="progress" style="height:8px;">
                                        <div
                                            class="progress-bar"
                                            role="progressbar"
                                            style="width:${Math.min(100, Math.max(0, Number(row.task_progress || 0)))}%"
                                            aria-valuenow="${row.task_progress || 0}"
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                        ></div>
                                    </div>

                                </div>
                            </td>

                                <td style="text-align:right">
                                    ${currency(row.invoiced_revenue)}
                                </td>

                                <td style="text-align:right">
                                    ${currency(row.total_cost)}
                                </td>

                                <td style="text-align:right">
                                    ${currency(row.actual_margin)}
                                </td>

                            </tr>
                        `;
                    });

                    prestations_html += `
                                </tbody>
                            </table>
                        </div>
                    `;
                }

                // --------------------------------------------------
                // TACHES
                // --------------------------------------------------

                let tasks_html = "";

                if (!data.tasks.length) {

                    tasks_html = `
                        <div class="text-muted">
                            Aucune tâche rattachée à ce dossier.
                        </div>
                    `;

                } else {

                    tasks_html = `
                        <div class="table-responsive">
                            <table class="table table-bordered table-hover table-sm">

                                <thead>
                                    <tr>
                                        <th>Tâche</th>
                                        <th>Prestation</th>
                                        <th>Statut</th>
                                        <th>Priorité</th>
                                        <th>Début</th>
                                        <th>Échéance</th>
                                        <th style="width:180px">
                                            Avancement
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                    `;

                    data.tasks.forEach(row => {

                        const progress = Math.min(
                            100,
                            Math.max(
                                0,
                                Number(row.progress || 0)
                            )
                        );

                        const is_overdue =
                            row.status === "Overdue";

                        tasks_html += `
                            <tr class="${is_overdue ? "table-danger" : ""}">

                                <td>
                                    ${link(
                                        "Task",
                                        row.name,
                                        row.subject
                                    )}
                                </td>

                                <td>
                                    ${
                                        row.custom_prestation
                                        ? link(
                                            "Prestation",
                                            row.custom_prestation,
                                            row.prestation_name ||
                                            row.custom_prestation
                                        )
                                        : "-"
                                    }
                                </td>

                                <td>
                                    ${status_badge(row.status)}
                                </td>

                                <td>
                                    ${priority_badge(row.priority)}
                                </td>

                                <td>
                                    ${row.exp_start_date || "-"}
                                </td>

                                <td>
                                    ${row.exp_end_date || "-"}
                                </td>

                                <td>

                                    <div class="progress"
                                         style="height:18px">

                                        <div
                                            class="progress-bar"
                                            role="progressbar"
                                            style="width:${progress}%"
                                            aria-valuenow="${progress}"
                                            aria-valuemin="0"
                                            aria-valuemax="100">

                                            ${progress}%

                                        </div>

                                    </div>

                                </td>

                            </tr>
                        `;
                    });

                    tasks_html += `
                                </tbody>
                            </table>
                        </div>
                    `;
                }

                // --------------------------------------------------
                // EXPEDITIONS
                // --------------------------------------------------

                let expeditions_html = "";

                if (!data.expeditions.length) {

                    expeditions_html = `
                        <div class="text-muted">
                            Aucune expédition rattachée à ce dossier.
                        </div>
                    `;

                } else {

                    expeditions_html = `
                        <div class="table-responsive">

                            <table class="table table-bordered table-hover table-sm">

                                <thead>
                                    <tr>
                                        <th>Expédition</th>
                                        <th>Opération</th>
                                        <th>Transport</th>
                                        <th style="text-align:right">
                                            CA
                                        </th>
                                        <th style="text-align:right">
                                            Coût
                                        </th>
                                        <th style="text-align:right">
                                            Marge
                                        </th>
                                        <th style="text-align:right">
                                            Rentabilité
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                    `;

                    data.expeditions.forEach(row => {

                        expeditions_html += `
                            <tr>

                                <td>
                                    ${link(
                                        "Expedition",
                                        row.name,
                                        row.name
                                    )}
                                </td>

                                <td>
                                    ${row.operation_type || "-"}
                                </td>

                                <td>
                                    ${row.mode_transport || "-"}
                                </td>

                                <td style="text-align:right">
                                    ${currency(row.invoiced_revenue)}
                                </td>

                                <td style="text-align:right">
                                    ${currency(row.total_cost)}
                                </td>

                                <td style="text-align:right">
                                    ${currency(row.actual_margin)}
                                </td>

                                <td style="text-align:right">
                                    ${row.profitability_percent || 0} %
                                </td>

                            </tr>
                        `;
                    });

                    expeditions_html += `
                                </tbody>
                            </table>

                        </div>
                    `;
                }

                // --------------------------------------------------
                // DASHBOARD
                // --------------------------------------------------

                const html = `

                    <div class="deal-dashboard">

                        <h4 style="margin-bottom:20px">
                            Tableau de bord du dossier
                        </h4>

                        <!-- KPI OPERATIONNELS -->

                        <div class="row">

                            <div class="col-md-3">
                                <div class="card p-3">
                                    <div class="text-muted">
                                        Expéditions
                                    </div>
                                    <h3>
                                        ${kpi.expedition_count}
                                    </h3>
                                </div>
                            </div>

                            <div class="col-md-3">
                                <div class="card p-3">
                                    <div class="text-muted">
                                        Prestations
                                    </div>
                                    <h3>
                                        ${kpi.prestation_count}
                                    </h3>
                                </div>
                            </div>

                            <div class="col-md-3">
                                <div class="card p-3">
                                    <div class="text-muted">
                                        Tâches
                                    </div>
                                    <h3>
                                        ${kpi.task_count}
                                    </h3>
                                    <small>
                                        ${kpi.completed_task_count}
                                        terminée(s)
                                    </small>
                                </div>
                            </div>

                            <div class="col-md-3">
                                <div class="card p-3">
                                    <div class="text-muted">
                                        Tâches en retard
                                    </div>
                                    <h3>
                                        ${kpi.overdue_task_count}
                                    </h3>
                                </div>
                            </div>

                        </div>

                        <!-- KPI FINANCIERS -->

                        <div style="margin-top:30px">

                            <h4>
                                Situation financière
                            </h4>

                            <!-- LIGNE 1 -->

                            <div class="row">

                                <div class="col-md-3">
                                    <div class="card p-3">
                                        <div class="text-muted">
                                            CA facturé
                                        </div>
                                        <h4>
                                            ${currency(kpi.invoiced_revenue)}
                                        </h4>
                                        <small class="text-muted">
                                            ${kpi.sales_invoice_count || 0}
                                            facture(s) client
                                        </small>
                                    </div>
                                </div>

                                <div class="col-md-3">
                                    <div class="card p-3">
                                        <div class="text-muted">
                                            CA encaissé
                                        </div>
                                        <h4>
                                            ${currency(kpi.collected_revenue)}
                                        </h4>
                                    </div>
                                </div>

                                <div class="col-md-3">
                                    <div class="card p-3">
                                        <div class="text-muted">
                                            Reste à encaisser
                                        </div>
                                        <h4>
                                            ${currency(kpi.outstanding_revenue)}
                                        </h4>
                                    </div>
                                </div>

                                <div class="col-md-3">
                                    <div class="card p-3">
                                        <div class="text-muted">
                                            Encaissement
                                        </div>
                                        <h4>
                                            ${
                                                kpi.invoiced_revenue
                                                    ? (
                                                        kpi.collected_revenue *
                                                        100 /
                                                        kpi.invoiced_revenue
                                                    ).toFixed(2)
                                                    : "0.00"
                                            } %
                                        </h4>
                                    </div>
                                </div>

                            </div>

                            <!-- LIGNE 2 -->

                            <div class="row" style="margin-top:15px">

                                <div class="col-md-3">
                                    <div class="card p-3">
                                        <div class="text-muted">
                                            Coûts fournisseurs
                                        </div>
                                        <h4>
                                            ${currency(kpi.total_cost)}
                                        </h4>
                                        <small class="text-muted">
                                            ${kpi.purchase_invoice_count || 0}
                                            facture(s) fournisseur
                                        </small>
                                    </div>
                                </div>

                                <div class="col-md-3">
                                    <div class="card p-3">
                                        <div class="text-muted">
                                            Coûts payés
                                        </div>
                                        <h4>
                                            ${currency(kpi.paid_cost)}
                                        </h4>
                                    </div>
                                </div>

                                <div class="col-md-3">
                                    <div class="card p-3">
                                        <div class="text-muted">
                                            Reste à payer
                                        </div>
                                        <h4>
                                            ${currency(kpi.outstanding_cost)}
                                        </h4>
                                    </div>
                                </div>

                                <div class="col-md-3">
                                    <div class="card p-3">
                                        <div class="text-muted">
                                            Marge réelle
                                        </div>
                                        <h4>
                                            ${currency(kpi.actual_margin)}
                                        </h4>
                                    </div>
                                </div>

                            </div>

                            <!-- LIGNE 3 -->

                            <div class="row" style="margin-top:15px">

                                <div class="col-md-6">
                                    <div class="card p-3">
                                        <div class="text-muted">
                                            Rentabilité
                                        </div>
                                        <h3>
                                            ${kpi.profitability_percent || 0} %
                                        </h3>
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="card p-3">
                                        <div class="text-muted">
                                            Situation nette
                                        </div>
                                        <h3>
                                            ${currency(
                                                (kpi.collected_revenue || 0)
                                                - (kpi.paid_cost || 0)
                                            )}
                                        </h3>
                                        <small class="text-muted">
                                            Encaissements - coûts payés
                                        </small>
                                    </div>
                                </div>

                            </div>

                        </div>

                        <!-- AVANCEMENT -->

                        <div style="margin-top:30px">

                            <h4>
                                Avancement opérationnel
                            </h4>

                            <div style="margin-bottom:8px">

                                <strong>
                                    ${kpi.task_progress}%
                                </strong>

                                <span class="text-muted">
                                    — ${kpi.completed_task_count}
                                    tâche(s) terminée(s) sur
                                    ${kpi.task_count}
                                </span>

                            </div>

                            <div class="progress"
                                 style="height:25px">

                                <div
                                    class="progress-bar"
                                    role="progressbar"
                                    style="width:${kpi.task_progress}%"
                                    aria-valuenow="${kpi.task_progress}"
                                    aria-valuemin="0"
                                    aria-valuemax="100">

                                    ${kpi.task_progress}%

                                </div>

                            </div>

                        </div>

                        <!-- PRESTATIONS -->

                        <div style="margin-top:30px">

                            <div style="
                                display:flex;
                                justify-content:space-between;
                                align-items:center;
                                margin-bottom:10px;
                            ">

                                <h4 style="margin:0">
                                    Prestations
                                </h4>

                                <button
                                    class="btn btn-primary btn-sm"
                                    id="btn-new-prestation"
                                >
                                    + Nouvelle prestation
                                </button>

                            </div>

                            ${prestations_html}

                        </div>

                        <!-- FACTURES CLIENTS -->

                        <div style="margin-top:30px">

                            <h4>
                                Factures clients
                            </h4>

                            ${
                                (data.sales_invoices || []).length
                                ? `
                                    <div class="table-responsive">
                                        <table class="table table-bordered table-hover table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Facture</th>
                                                    <th>Client</th>
                                                    <th>Date</th>
                                                    <th>Montant</th>
                                                    <th>Reste à encaisser</th>
                                                    <th>Statut</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>

                                            <tbody>

                                                ${(data.sales_invoices || []).map(invoice => `
                                                    <tr>

                                                        <td>
                                                            ${link(
                                                                "Sales Invoice",
                                                                invoice.name,
                                                                invoice.name
                                                            )}
                                                        </td>

                                                        <td>
                                                            ${invoice.customer || "-"}
                                                        </td>

                                                        <td>
                                                            ${invoice.posting_date || "-"}
                                                        </td>

                                                        <td>
                                                            ${currency(invoice.grand_total)}
                                                        </td>

                                                        <td>
                                                            ${currency(invoice.outstanding_amount)}
                                                        </td>

                                                        <td>
                                                        ${invoice_status(invoice.status)}
                                                    </td>

                                                    <td>
                                                        ${
                                                            Number(invoice.outstanding_amount || 0) > 0
                                                                ? `
                                                                    <button
                                                                        class="btn btn-primary btn-xs btn-pay-invoice"
                                                                        data-doctype="Sales Invoice"
                                                                        data-name="${invoice.name}"
                                                                    >
                                                                        Régler
                                                                    </button>
                                                                `
                                                                : ""
                                                        }
                                                    </td>

                                                    </tr>
                                                `).join("")}

                                            </tbody>
                                        </table>
                                    </div>
                                `
                                : `
                                    <div class="text-muted">
                                        Aucune facture client rattachée à ce dossier.
                                    </div>
                                `
                            }

                        </div>


                        <!-- FACTURES FOURNISSEURS -->

                        <div style="margin-top:30px">

                            <h4>
                                Factures fournisseurs
                            </h4>

                            ${
                                (data.purchase_invoices || []).length
                                ? `
                                    <div class="table-responsive">

                                        <table class="table table-bordered table-hover table-sm">

                                            <thead>
                                                <tr>
                                                    <th>Facture</th>
                                                    <th>Fournisseur</th>
                                                    <th>Date</th>
                                                    <th>Montant</th>
                                                    <th>Reste à payer</th>
                                                    <th>Statut</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>

                                            <tbody>

                                                ${(data.purchase_invoices || []).map(invoice => `
                                                    <tr>

                                                        <td>
                                                            ${link(
                                                                "Purchase Invoice",
                                                                invoice.name,
                                                                invoice.name
                                                            )}
                                                        </td>

                                                        <td>
                                                            ${invoice.supplier || "-"}
                                                        </td>

                                                        <td>
                                                            ${invoice.posting_date || "-"}
                                                        </td>

                                                        <td>
                                                            ${currency(invoice.grand_total)}
                                                        </td>

                                                        <td>
                                                            ${currency(invoice.outstanding_amount)}
                                                        </td>

                                                        <td>
                                                        ${invoice_status(invoice.status)}
                                                    </td>

                                                    <td>
                                                        ${
                                                            Number(invoice.outstanding_amount || 0) > 0
                                                                ? `
                                                                    <button
                                                                        class="btn btn-primary btn-xs btn-pay-invoice"
                                                                        data-doctype="Purchase Invoice"
                                                                        data-name="${invoice.name}"
                                                                    >
                                                                        Régler
                                                                    </button>
                                                                `
                                                                : ""
                                                        }
                                                    </td>

                                                    </tr>
                                                `).join("")}

                                            </tbody>

                                        </table>

                                    </div>
                                `
                                : `
                                    <div class="text-muted">
                                        Aucune facture fournisseur rattachée à ce dossier.
                                    </div>
                                `
                            }

                        </div>


                        <!-- REGLEMENTS -->

                        <div style="margin-top:30px">

                            <h4>
                                Règlements
                            </h4>

                            ${
                                (data.payments || []).length
                                ? `
                                    <div class="table-responsive">

                                        <table class="table table-bordered table-hover table-sm">

                                            <thead>
                                                <tr>
                                                    <th>Règlement</th>
                                                    <th>Type</th>
                                                    <th>Tiers</th>
                                                    <th>Facture</th>
                                                    <th>Date</th>
                                                    <th>Montant</th>
                                                    <th>Statut</th>
                                                </tr>
                                            </thead>

                                            <tbody>

                                                ${(data.payments || []).map(payment => `

                                                    <tr>

                                                        <td>
                                                            ${link(
                                                                "Payment Entry",
                                                                payment.name,
                                                                payment.name
                                                            )}
                                                        </td>

                                                        <td>
                                                            ${
                                                                payment.payment_type === "Receive"
                                                                    ? "Encaissement client"
                                                                    : payment.payment_type === "Pay"
                                                                        ? "Règlement fournisseur"
                                                                        : payment.payment_type || "-"
                                                            }
                                                        </td>

                                                        <td>
                                                            ${payment.party || "-"}
                                                        </td>

                                                        <td>
                                                            ${link(
                                                                payment.reference_doctype,
                                                                payment.reference_name,
                                                                payment.reference_name
                                                            )}
                                                        </td>

                                                        <td>
                                                            ${payment.posting_date || "-"}
                                                        </td>

                                                        <td>
                                                            ${currency(payment.allocated_amount)}
                                                        </td>

                                                        <td>
                                                            ${
                                                                payment.status === "Submitted"
                                                                    ? `<span class="badge" style="background:#198754;color:#fff;">Validé</span>`
                                                                    : payment.status === "Cancelled"
                                                                        ? `<span class="badge" style="background:#dc3545;color:#fff;">Annulé</span>`
                                                                        : payment.status === "Draft"
                                                                            ? `<span class="badge" style="background:#6c757d;color:#fff;">Brouillon</span>`
                                                                            : payment.status || "-"
                                                            }
                                                        </td>

                                                    </tr>

                                                `).join("")}

                                            </tbody>

                                        </table>

                                    </div>
                                `
                                : `
                                    <div class="text-muted">
                                        Aucun règlement enregistré pour ce dossier.
                                    </div>
                                `
                            }

                        </div>


                        <!-- TACHES -->

                        <div style="margin-top:30px">

                            <h4>
                                Tâches
                            </h4>

                            ${tasks_html}

                        </div>

                        <!-- EXPEDITIONS -->

                        <div style="margin-top:30px">

                            <div style="
                                display:flex;
                                justify-content:space-between;
                                align-items:center;
                                margin-bottom:10px;
                            ">

                                <h4 style="margin:0">
                                    Expéditions
                                </h4>

                                <button
                                    class="btn btn-primary btn-sm"
                                    id="btn-new-expedition"
                                >
                                    + Nouvelle expédition
                                </button>

                            </div>

                            ${expeditions_html}

                        </div>

                    </div>
                `;

                if (frm.fields_dict.dashboard_html) {

                    frm.fields_dict.dashboard_html.$wrapper.html(html);

                    frm.fields_dict.dashboard_html.$wrapper
                        .find("#btn-new-prestation")
                        .on("click", function () {

                            frappe.new_doc("Prestation", {
                                dossier: frm.doc.name,
                                custom_client: frm.doc.customer
                            });

                        });

                    frm.fields_dict.dashboard_html.$wrapper
                        .find("#btn-new-expedition")
                        .on("click", function () {

                            frappe.new_doc("Expedition", {
                                deal_dossier: frm.doc.name,
                                custom_client: frm.doc.customer,
                                custom_société: frm.doc.company
                            });

                        });


                    // --------------------------------------------------
                    // REGLEMENT DIRECT D'UNE FACTURE
                    // --------------------------------------------------

                    frm.fields_dict.dashboard_html.$wrapper
                        .find(".btn-pay-invoice")
                        .on("click", function () {

                            const button = $(this);

                            const doctype = button.attr("data-doctype");
                            const name = button.attr("data-name");

                            if (!doctype || !name) {
                                frappe.msgprint(
                                    "Impossible d'identifier la facture."
                                );
                                return;
                            }

                            frappe.call({
                                method: "erpnext.accounts.doctype.payment_entry.payment_entry.get_payment_entry",
                                args: {
                                    dt: doctype,
                                    dn: name
                                },
                                freeze: true,
                                freeze_message: "Préparation du règlement..."
                            }).then(r => {

                                if (!r.message) {
                                    frappe.msgprint(
                                        "Impossible de préparer le règlement."
                                    );
                                    return;
                                }

                                const payment_entry = r.message;

                                payment_entry.custom_dossier = frm.doc.name;

                                frappe.model.sync(payment_entry);

                                frappe.set_route(
                                    "Form",
                                    "Payment Entry",
                                    payment_entry.name
                                );

                            });

                        });
                }
            }
        });
    }
});
