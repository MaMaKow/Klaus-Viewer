document.addEventListener('DOMContentLoaded', function() {
    const cabinetSelect = document.getElementById('cabinet-select');
    const drawerSelect = document.getElementById('drawer-select');
    const visualizeBtn = document.getElementById('visualize-btn');
    const visualizationContainer = document.getElementById('visualization-container');
    const drawerElement = document.getElementById('drawer');
    const drawerTitle = document.getElementById('drawer-title');
    const lastUpdateElement = document.getElementById('last-update');
    const drawerInfoElement = document.getElementById('drawer-info');
    const loadingElement = document.getElementById('loading');
    const noDataElement = document.getElementById('no-data');
    const packageDetailsElement = document.getElementById('package-details');
    const packageInfoElement = document.getElementById('package-info');

    const apiBaseUrl = document.body.dataset.apiBaseUrl || 'api';

    // Globale Variablen für Schubladenabmessungen basierend auf der Datenbankabfrage
    const minX = 40;
    const maxX = 1130;
    const minY = 20;
    const maxY = 1305;
    const schubladeWidth = maxX - minX;
    const schubladeHeight = maxY - minY;

    fetchCabinets();

    async function fetchJson(url) {
        const response = await fetch(url, {
            headers: {
                Accept: 'application/json'
            }
        });

        let payload = {};
        try {
            payload = await response.json();
        } catch (error) {
            payload = {};
        }

        if (!response.ok) {
            const message = payload.error || `HTTP ${response.status}`;
            throw new Error(message);
        }

        return payload;
    }

    async function fetchCabinets() {
        try {
            loadingElement.style.display = 'block';

            const payload = await fetchJson(`${apiBaseUrl}/pack-cabinets.php`);
            const cabinets = payload.packCabinets || [];

            cabinets.forEach(cabinet => {
                const option = document.createElement('option');
                option.value = cabinet;
                option.textContent = `Schrank ${cabinet}`;
                cabinetSelect.appendChild(option);
            });

            loadingElement.style.display = 'none';
        } catch (error) {
            console.error('Fehler beim Laden der Schränke:', error);
            loadingElement.style.display = 'none';
            alert('Fehler beim Laden der Schränke. Bitte versuchen Sie es später erneut.');
        }
    }

    cabinetSelect.addEventListener('change', async function() {
        const cabinetId = this.value;

        drawerSelect.innerHTML = '<option value="">Bitte wählen Sie eine Schublade</option>';
        drawerSelect.disabled = !cabinetId;
        visualizeBtn.disabled = true;
        visualizationContainer.style.display = 'none';
        noDataElement.style.display = 'none';

        if (cabinetId) {
            try {
                loadingElement.style.display = 'block';

                const query = new URLSearchParams({
                    packCabinet: cabinetId
                });
                const payload = await fetchJson(`${apiBaseUrl}/pack-drawers.php?${query.toString()}`);
                const drawers = payload.packDrawers || [];

                if (drawers.length > 0) {
                    drawers.forEach(drawer => {
                        const option = document.createElement('option');
                        option.value = drawer;
                        option.textContent = `Schublade ${drawer}`;
                        drawerSelect.appendChild(option);
                    });
                    drawerSelect.disabled = false;
                } else {
                    drawerSelect.disabled = true;
                    visualizeBtn.disabled = true;
                }

                loadingElement.style.display = 'none';
            } catch (error) {
                console.error('Fehler beim Laden der Schubladen:', error);
                loadingElement.style.display = 'none';
                alert('Fehler beim Laden der Schubladen. Bitte versuchen Sie es später erneut.');
            }
        }
    });

    drawerSelect.addEventListener('change', function() {
        visualizeBtn.disabled = !this.value;
    });

    visualizeBtn.addEventListener('click', async function() {
        const cabinetId = cabinetSelect.value;
        const drawerId = drawerSelect.value;

        if (cabinetId && drawerId) {
            try {
                loadingElement.style.display = 'block';
                visualizationContainer.style.display = 'none';
                noDataElement.style.display = 'none';
                packageDetailsElement.style.display = 'none';

                const query = new URLSearchParams({
                    packCabinet: cabinetId,
                    packDrawer: drawerId
                });
                const payload = await fetchJson(`${apiBaseUrl}/pack-packages.php?${query.toString()}`);
                const packages = payload.packages || [];

                if (packages.length > 0) {
                    renderDrawer(cabinetId, drawerId, packages);
                    visualizationContainer.style.display = 'block';
                    noDataElement.style.display = 'none';
                } else {
                    visualizationContainer.style.display = 'none';
                    noDataElement.style.display = 'block';
                }

                loadingElement.style.display = 'none';
            } catch (error) {
                console.error('Fehler beim Laden der Packungen:', error);
                loadingElement.style.display = 'none';
                alert('Fehler beim Laden der Packungen. Bitte versuchen Sie es später erneut.');
            }
        }
    });

    function renderDrawer(cabinetId, drawerId, packages) {
        drawerTitle.textContent = `Schrank ${cabinetId}, Schublade ${drawerId}`;

        const containerWidth = 800;
        const scaleFactor = containerWidth / schubladeWidth;
        const containerHeight = schubladeHeight * scaleFactor;

        drawerElement.style.width = `${containerWidth}px`;
        drawerElement.style.height = `${containerHeight}px`;
        drawerElement.innerHTML = '';

        packages.forEach(pkg => {
            const x = (maxX - pkg.PackPlaceX - pkg.PackLength) * scaleFactor;
            const y = (maxY - pkg.PackPlaceY - pkg.PackWidth) * scaleFactor;
            const width = pkg.PackLength * scaleFactor;
            const height = pkg.PackWidth * scaleFactor;

            const packageElement = document.createElement('div');
            packageElement.className = 'package';
            packageElement.style.left = `${x}px`;
            packageElement.style.top = `${y}px`;
            packageElement.style.width = `${width}px`;
            packageElement.style.height = `${height}px`;
            packageElement.title = `${pkg.ArticleId || 'Unbekannt'}\n${pkg.Description || ''}`;
            packageElement.dataset.package = JSON.stringify(pkg);

            const shortText = pkg.ArticleId ? pkg.ArticleId.substring(0, 4) + '...' : 'PKG';
            packageElement.textContent = shortText;

            packageElement.addEventListener('click', function() {
                showPackageDetails(JSON.parse(this.dataset.package));
            });

            drawerElement.appendChild(packageElement);
        });

        const latestSnapshot = packages.reduce((latest, pkg) => {
            const snapshotTime = new Date(pkg.SnapshotTime);
            return snapshotTime > latest ? snapshotTime : latest;
        }, new Date(0));

        lastUpdateElement.textContent = `Letzte Aktualisierung: ${latestSnapshot.toLocaleString()}`;

        drawerInfoElement.innerHTML = `
            <p><strong>Schrank:</strong> ${cabinetId}</p>
            <p><strong>Schublade:</strong> ${drawerId}</p>
            <p><strong>Anzahl Packungen:</strong> ${packages.length}</p>
            <p><strong>Abmessungen der Schublade:</strong> ${schubladeWidth}mm x ${schubladeHeight}mm</p>
        `;
    }

    function showPackageDetails(pkg) {
        packageInfoElement.innerHTML = `
            <div><span class="label">Packungs-ID:</span> <span>${pkg.PackId || 'N/A'}</span></div>
            <div><span class="label">Artikel-ID:</span> <span>${pkg.ArticleId || 'N/A'}</span></div>
            <div><span class="label">Beschreibung:</span> <span>${pkg.Description || 'N/A'}</span></div>
            <div><span class="label">Charge:</span> <span>${pkg.PackBatchNo || 'N/A'}</span></div>
            <div><span class="label">Seriennummer:</span> <span>${pkg.PackSerialNo || 'N/A'}</span></div>
            <div><span class="label">Ablaufdatum:</span> <span>${pkg.PackExpiryDate || 'N/A'}</span></div>
            <div><span class="label">Position X:</span> <span>${pkg.PackPlaceX || 'N/A'}</span></div>
            <div><span class="label">Position Y:</span> <span>${pkg.PackPlaceY || 'N/A'}</span></div>
            <div><span class="label">Länge:</span> <span>${pkg.PackLength || 'N/A'} mm</span></div>
            <div><span class="label">Breite:</span> <span>${pkg.PackWidth || 'N/A'} mm</span></div>
            <div><span class="label">Höhe:</span> <span>${pkg.PackHeight || 'N/A'} mm</span></div>
            <div><span class="label">Eingelagert am:</span> <span>${pkg.PackDateIn ? new Date(pkg.PackDateIn).toLocaleString() : 'N/A'}</span></div>
        `;

        packageDetailsElement.style.display = 'block';
    }
});
