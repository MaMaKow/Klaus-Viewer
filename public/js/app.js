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

    // Globale Variablen für Schubladenabmessungen basierend auf der Datenbankabfrage
    const minX = 40;
    const maxX = 1130;
    const minY = 20;
    const maxY = 1305;
    const schubladeWidth = maxX - minX;
    const schubladeHeight = maxY - minY;

    // Schränke und Schubladen aus der Datenbank abrufen
    fetchCabinets();

    // Funktion zum Abrufen der Schränke aus der Datenbank
    async function fetchCabinets() {
        try {
            loadingElement.style.display = 'block';

            // In einer echten Anwendung würde hier ein AJAX-Request an den Server gehen
            // Für dieses Beispiel simulieren wir die Daten
            const cabinets = await mockFetchCabinets();

            // Schränke in die Auswahl laden
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

    // Event-Listener für Schrankauswahl
    cabinetSelect.addEventListener('change', async function() {
        const cabinetId = this.value;

        // Schubladen-Auswahl zurücksetzen
        drawerSelect.innerHTML = '<option value="">Bitte wählen Sie eine Schublade</option>';
        drawerSelect.disabled = !cabinetId;
        visualizeBtn.disabled = true;
        visualizationContainer.style.display = 'none';
        noDataElement.style.display = 'none';

        if (cabinetId) {
            try {
                loadingElement.style.display = 'block';

                // Schubladen für den ausgewählten Schrank abrufen
                const drawers = await mockFetchDrawers(cabinetId);

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

    // Event-Listener für Schubladenauswahl
    drawerSelect.addEventListener('change', function() {
        visualizeBtn.disabled = !this.value;
    });

    // Event-Listener für Visualisieren-Button
    visualizeBtn.addEventListener('click', async function() {
        const cabinetId = cabinetSelect.value;
        const drawerId = drawerSelect.value;

        if (cabinetId && drawerId) {
            try {
                loadingElement.style.display = 'block';
                visualizationContainer.style.display = 'none';
                noDataElement.style.display = 'none';
                packageDetailsElement.style.display = 'none';

                // Packungen für die ausgewählte Schublade abrufen
                const packages = await mockFetchPackages(cabinetId, drawerId);

                if (packages && packages.length > 0) {
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

    // Funktion zum Rendern der Schublade mit Packungen
    function renderDrawer(cabinetId, drawerId, packages) {
        // Titel aktualisieren
        drawerTitle.textContent = `Schrank ${cabinetId}, Schublade ${drawerId}`;

        // Schubladengröße setzen (basierend auf den min/max Werten aus der DB)
        const containerWidth = 800;
        const scaleFactor = containerWidth / schubladeWidth;
        const containerHeight = schubladeHeight * scaleFactor;

        drawerElement.style.width = `${containerWidth}px`;
        drawerElement.style.height = `${containerHeight}px`;

        // Alte Packungen entfernen
        drawerElement.innerHTML = '';

        // Packungen hinzufügen
        packages.forEach(pkg => {
            // Position und Größe skalieren
            const x = (pkg.PackPlaceX - minX) * scaleFactor;
            const y = (pkg.PackPlaceY - minY) * scaleFactor;
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

            // Kürzel für die Anzeige auf der Packung
            const shortText = pkg.ArticleId ? pkg.ArticleId.substring(0, 4) + '...' : 'PKG';
            packageElement.textContent = shortText;

            // Event-Listener für Klick auf Packung
            packageElement.addEventListener('click', function() {
                showPackageDetails(JSON.parse(this.dataset.package));
            });

            drawerElement.appendChild(packageElement);
        });

        // Letzte Aktualisierung anzeigen
        const latestSnapshot = packages.reduce((latest, pkg) => {
            const snapshotTime = new Date(pkg.SnapshotTime);
            return snapshotTime > latest ? snapshotTime : latest;
        }, new Date(0));

        lastUpdateElement.textContent = `Letzte Aktualisierung: ${latestSnapshot.toLocaleString()}`;

        // Schubladeninformationen anzeigen
        drawerInfoElement.innerHTML = `
            <p><strong>Schrank:</strong> ${cabinetId}</p>
            <p><strong>Schublade:</strong> ${drawerId}</p>
            <p><strong>Anzahl Packungen:</strong> ${packages.length}</p>
            <p><strong>Abmessungen der Schublade:</strong> ${schubladeWidth}mm x ${schubladeHeight}mm</p>
        `;
    }

    // Funktion zum Anzeigen der Packungsdetails
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

    // Mock-Funktionen zur Simulation der Datenbankabfragen
    async function mockFetchCabinets() {
        // Simulierte Verzögerung für den API-Aufruf
        await new Promise(resolve => setTimeout(resolve, 500));

        // Rückgabe von simulierten Schrankdaten
        return [1, 2, 3, 4, 5];
    }

    async function mockFetchDrawers(cabinetId) {
        // Simulierte Verzögerung für den API-Aufruf
        await new Promise(resolve => setTimeout(resolve, 500));

        // Rückgabe von simulierten Schubladendaten basierend auf dem Schrank
        const drawersByCabinet = {
            1: [1, 2, 3],
            2: [1, 2],
            3: [1, 2, 3, 4],
            4: [1],
            5: [1, 2, 3, 4, 5]
        };

        return drawersByCabinet[cabinetId] || [];
    }

    async function mockFetchPackages(cabinetId, drawerId) {
        // Simulierte Verzögerung für den API-Aufruf
        await new Promise(resolve => setTimeout(resolve, 800));

        // Zufällige Entscheidung, ob Packungen vorhanden sind
        if (Math.random() < 0.1) return []; // 10% Chance, dass keine Packungen vorhanden sind

        // Generiere eine zufällige Anzahl von Packungen (zwischen 3 und 15)
        const numPackages = Math.floor(Math.random() * 13) + 3;
        const packages = [];

        for (let i = 0; i < numPackages; i++) {
            // Generiere zufällige Positionen und Abmessungen innerhalb der Schublade
            const packLength = Math.floor(Math.random() * 100) + 50;
            const packWidth = Math.floor(Math.random() * 80) + 40;
            const packHeight = Math.floor(Math.random() * 60) + 30;

            // Stelle sicher, dass die Packung innerhalb der Schublade liegt
            const packPlaceX = Math.floor(Math.random() * (schubladeWidth - packLength)) + minX;
            const packPlaceY = Math.floor(Math.random() * (schubladeHeight - packWidth)) + minY;

            packages.push({
                PackId: Math.floor(Math.random() * 10000),
                ArticleId: `ART-${Math.floor(Math.random() * 1000)}`,
                Description: `Artikelbeschreibung ${Math.floor(Math.random() * 1000)}`,
                PackBatchNo: `BATCH-${Math.floor(Math.random() * 100)}`,
                PackSerialNo: `SN-${Math.floor(Math.random() * 10000)}`,
                PackExpiryDate: new Date(Date.now() + Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toLocaleDateString(),
                PackPlaceX: packPlaceX,
                PackPlaceY: packPlaceY,
                PackLength: packLength,
                PackWidth: packWidth,
                PackHeight: packHeight,
                PackDateIn: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)),
                SnapshotTime: new Date()
            });
        }

        return packages;
    }
});
