(() => {
    const STYLE_ID = "dealerp-gestion-logistique-style";

    function inject_css() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement("style");
        style.id = STYLE_ID;

        style.textContent = `
            .dealerp-gl-dashboard {
                padding: 8px 4px 32px;
            }

            .dealerp-gl-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 18px;
            }

            .dealerp-gl-card {
                background: var(--card-bg, #fff);
                border: 1px solid var(--border-color, #e5e7eb);
                border-radius: 12px;
                padding: 20px;
                min-height: 280px;
            }

            .dealerp-gl-card-title {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 18px;
                font-size: 17px;
                font-weight: 600;
                color: var(--text-color, #171717);
            }

            .dealerp-gl-card-title .icon {
                color: var(--text-muted, #6b7280);
            }

            .dealerp-gl-links {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .dealerp-gl-link {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 10px 8px;
                border-radius: 8px;
                color: var(--text-color, #171717);
                text-decoration: none;
                cursor: pointer;
                transition: background .15s ease;
            }

            .dealerp-gl-link:hover {
                background: var(--subtle-fg, #f5f5f5);
            }

            .dealerp-gl-link-left {
                display: flex;
                align-items: center;
                gap: 10px;
                min-width: 0;
            }

            .dealerp-gl-link-icon {
                color: var(--text-muted, #737373);
                flex-shrink: 0;
            }

            .dealerp-gl-link-label {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .dealerp-gl-count {
                min-width: 28px;
                height: 24px;
                padding: 0 8px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                background: var(--subtle-fg, #f3f4f6);
                color: var(--text-muted, #525252);
                font-size: 12px;
                font-weight: 600;
                flex-shrink: 0;
            }

            @media (max-width: 900px) {
                .dealerp-gl-grid {
                    grid-template-columns: 1fr;
                }

                .dealerp-gl-card {
                    min-height: auto;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function create_card(title, icon, items) {
        const card = document.createElement("div");
        card.className = "dealerp-gl-card";

        const title_el = document.createElement("div");
        title_el.className = "dealerp-gl-card-title";

        title_el.innerHTML = `
            <span class="icon">${frappe.utils.icon(icon, "md")}</span>
            <span>${frappe.utils.escape_html(title)}</span>
        `;

        card.appendChild(title_el);

        const links = document.createElement("div");
        links.className = "dealerp-gl-links";

        items.forEach(item => {
            const link = document.createElement("div");
            link.className = "dealerp-gl-link";

            link.innerHTML = `
                <span class="dealerp-gl-link-left">
                    <span class="dealerp-gl-link-icon">
                        ${frappe.utils.icon(item.icon || "arrow-right", "sm")}
                    </span>
                    <span class="dealerp-gl-link-label">
                        ${frappe.utils.escape_html(item.label)}
                    </span>
                </span>
                ${
                    item.count !== undefined && item.count !== null
                        ? `<span class="dealerp-gl-count">${item.count}</span>`
                        : ""
                }
            `;

            link.addEventListener("click", () => {
                frappe.set_route(item.route);
            });

            links.appendChild(link);
        });

        card.appendChild(links);

        return card;
    }

    function render() {
        const workspace = document.querySelector(".layout-main-section");

        if (!workspace) return;

        /*
         * On ne détruit pas le Workspace Frappe.
         * On remplace uniquement son contenu visuel.
         */
        let container = workspace.querySelector(".dealerp-gl-dashboard");

        if (!container) {
            workspace.innerHTML = "";
            container = document.createElement("div");
            container.className = "dealerp-gl-dashboard";
            workspace.appendChild(container);
        }

        container.innerHTML = "";

        const grid = document.createElement("div");
        grid.className = "dealerp-gl-grid";

        grid.appendChild(
            create_card("Opérations", "truck", [
                {
                    label: "Dossiers",
                    route: "List/Dossier",
                    icon: "folder-open"
                },
                {
                    label: "Expéditions",
                    route: "List/Expedition",
                    icon: "truck"
                },
                {
                    label: "Prestations",
                    route: "List/Prestation",
                    icon: "briefcase"
                },
                {
                    label: "Tâches",
                    route: "List/Task",
                    icon: "check"
                },
                {
                    label: "Dépenses d'expédition",
                    route: "List/Expedition Expense",
                    icon: "wallet"
                }
            ])
        );

        grid.appendChild(
            create_card("Pilotage", "chart-line", [
                {
                    label: "Dossiers",
                    route: "List/Dossier",
                    icon: "folder-open"
                },
                {
                    label: "Expéditions",
                    route: "List/Expedition",
                    icon: "truck"
                },
                {
                    label: "Prestations",
                    route: "List/Prestation",
                    icon: "briefcase"
                }
            ])
        );

        grid.appendChild(
            create_card("Référentiels", "settings", [
                {
                    label: "Types de dossier",
                    route: "List/Type de dossier",
                    icon: "list"
                },
                {
                    label: "Types de prestation",
                    route: "List/Prestation Type",
                    icon: "list"
                },
                {
                    label: "Modèles de tâches",
                    route: "List/Prestation Type Task",
                    icon: "list"
                },
                {
                    label: "Types d'opération",
                    route: "List/Type operation",
                    icon: "list"
                },
                {
                    label: "Types de transit",
                    route: "List/Type de transit",
                    icon: "list"
                },
                {
                    label: "Modes de transport",
                    route: "List/Mode Transport",
                    icon: "truck"
                },
                {
                    label: "Ports",
                    route: "List/Port",
                    icon: "map-pin"
                }
            ])
        );

        container.appendChild(grid);
    }

    function init() {
        inject_css();

        setTimeout(render, 300);
        setTimeout(render, 1000);
    }

    frappe.after_ajax(() => {
        if (frappe.get_route()[0] === "gestion-logistique") {
            init();
        }
    });

    $(document).on("page-change", () => {
        if (frappe.get_route()[0] === "gestion-logistique") {
            init();
        }
    });
})();
