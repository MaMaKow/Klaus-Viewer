document.addEventListener('DOMContentLoaded', function() {
    const cabinetSelect = document.getElementById('cabinet-select');
    const drawerSelect = document.getElementById('drawer-select');
    const visualizeBtn = document.getElementById('visualize-btn');
    const searchQueryInput = document.getElementById('search-query');
    const searchFieldSelect = document.getElementById('search-field');
    const globalSearchCheckbox = document.getElementById('global-search-checkbox');
    const searchBtn = document.getElementById('search-btn');
    const resetSearchBtn = document.getElementById('reset-search-btn');
    const searchStatusElement = document.getElementById('search-status');
    const visualizationContainer = document.getElementById('visualization-container');
    const drawerElement = document.getElementById('drawer');
    const drawerTitle = document.getElementById('drawer-title');
    const lastUpdateElement = document.getElementById('last-update');
    const drawerInfoElement = document.getElementById('drawer-info');
    const loadingElement = document.getElementById('loading');
    const noDataElement = document.getElementById('no-data');
    const packageDetailsElement = document.getElementById('package-details');
    const packageInfoElement = document.getElementById('package-info');
    const searchResultsElement = document.getElementById('search-results');
    const searchResultsBodyElement = document.getElementById('search-results-body');

    const apiBaseUrl = document.body.dataset.apiBaseUrl || 'api';

    const minX = 0;
    const maxX = 1230;
    const minY = 0;
    const maxY = 1860;
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
        hideResultAreas();

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
        await fetchAndRenderPackages({
            searchQuery: '',
            searchField: 'all',
            useGlobalScope: false,
        });
    });

    searchBtn.addEventListener('click', async function() {
        await fetchAndRenderPackages({
            searchQuery: searchQueryInput.value.trim(),
            searchField: searchFieldSelect.value,
            useGlobalScope: globalSearchCheckbox.checked,
        });
    });

    resetSearchBtn.addEventListener('click', function() {
        searchQueryInput.value = '';
        searchFieldSelect.value = 'all';
        globalSearchCheckbox.checked = false;
        hideResultAreas();
    });

    searchQueryInput.addEventListener('keydown', async function(event) {
        if (event.key === 'Enter') {
            await fetchAndRenderPackages({
                searchQuery: searchQueryInput.value.trim(),
                searchField: searchFieldSelect.value,
                useGlobalScope: globalSearchCheckbox.checked,
            });
        }
    });

    async function fetchAndRenderPackages({ searchQuery = '', searchField = 'all', useGlobalScope = false }) {
        const cabinetId = cabinetSelect.value;
        const drawerId = drawerSelect.value;

        if (searchQuery === '') {
            if (useGlobalScope) {
                alert('Bitte geben Sie einen Suchbegriff für die globale Suche ein.');
                return;
            }
            if (!cabinetId || !drawerId) {
                alert('Bitte wählen Sie zuerst Schrank und Schublade oder aktivieren Sie die globale Suche mit Suchbegriff.');
                return;
            }
        }

        if (!useGlobalScope && (!cabinetId || !drawerId)) {
            alert('Bitte wählen Sie für die Schubladensuche zuerst Schrank und Schublade aus.');
            return;
        }

        try {
            loadingElement.style.display = 'block';
            hideResultAreas();

            const query = new URLSearchParams();

            if (!useGlobalScope) {
                query.set('packCabinet', cabinetId);
                query.set('packDrawer', drawerId);
            }

            if (searchQuery !== '') {
                query.set('search', searchQuery);
                query.set('searchField', searchField);
            }

            const payload = await fetchJson(`${apiBaseUrl}/pack-packages.php?${query.toString()}`);
            const packages = payload.packages || [];

            if (useGlobalScope && searchQuery !== '') {
                renderGlobalSearchResults(packages);
                showSearchStatus(searchQuery, searchField, packages.length, 'global');
                noDataElement.textContent = 'Keine Packungen im gesamten Kommissionierautomaten gefunden.';
                noDataElement.style.display = packages.length > 0 ? 'none' : 'block';
            } else {
                if (packages.length > 0) {
                    renderDrawer(cabinetId, drawerId, packages, searchQuery !== '');
                    visualizationContainer.style.display = 'block';
                    noDataElement.style.display = 'none';
                } else {
                    noDataElement.textContent = 'Keine Packungen in dieser Schublade vorhanden.';
                    noDataElement.style.display = 'block';
                }

                if (searchQuery !== '') {
                    showSearchStatus(searchQuery, searchField, packages.length, 'drawer', cabinetId, drawerId);
                }
            }

            loadingElement.style.display = 'none';
        } catch (error) {
            console.error('Fehler beim Laden der Packungen:', error);
            loadingElement.style.display = 'none';
            alert(`Fehler beim Laden der Packungen: ${error.message}`);
        }
    }

    function hideResultAreas() {
        visualizationContainer.style.display = 'none';
        searchResultsElement.style.display = 'none';
        noDataElement.style.display = 'none';
        packageDetailsElement.style.display = 'none';
        hideSearchStatus();
        searchResultsBodyElement.innerHTML = '';
    }

    function renderDrawer(cabinetId, drawerId, packages, highlightMatches) {
        drawerTitle.textContent = `Schrank ${cabinetId}, Schublade ${drawerId}`;

        const containerWidth = 1230;
        const scaleFactor = containerWidth / schubladeWidth;
        const containerHeight = schubladeHeight * scaleFactor;

        drawerElement.style.width = `${containerWidth}px`;
        drawerElement.style.height = `${containerHeight}px`;
        drawerElement.innerHTML = '';

        packages.forEach(pkg => {
            const x = (maxX - pkg.PackPlaceX - pkg.PackWidth) * scaleFactor;
            const y = (maxY - pkg.PackPlaceY - pkg.PackLength) * scaleFactor;
            const width = pkg.PackWidth * scaleFactor;
            const height = pkg.PackLength * scaleFactor;

            const packageElement = document.createElement('div');
            packageElement.className = 'package';
            if (highlightMatches) {
                packageElement.classList.add('match');
            }
            packageElement.style.left = `${x}px`;
            packageElement.style.top = `${y}px`;
            packageElement.style.width = `${width}px`;
            packageElement.style.height = `${height}px`;
            packageElement.title = `${pkg.Description || 'Unbekannt'}\n${pkg.ArticleId || ''}`;
            packageElement.dataset.package = JSON.stringify(pkg);
            packageElement.textContent = pkg.Description ? `${pkg.Description.substring(0, 6)}...` : 'PKG';

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

    function renderGlobalSearchResults(packages) {
        searchResultsBodyElement.innerHTML = '';

        packages.forEach(pkg => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${pkg.PackId || 'N/A'}</td>
                <td>${pkg.ArticleId || 'N/A'}</td>
                <td>${pkg.PackBatchNo || 'N/A'}</td>
                <td>${pkg.PackSerialNo || 'N/A'}</td>
                <td>${pkg.PackCabinet || 'N/A'}</td>
                <td>${pkg.PackDrawer || 'N/A'}</td>
                <td>${pkg.Description || 'N/A'}</td>
            `;
            searchResultsBodyElement.appendChild(row);
        });

        searchResultsElement.style.display = packages.length > 0 ? 'block' : 'none';
    }

    function showSearchStatus(query, field, count, scope, cabinetId = null, drawerId = null) {
        const labelByField = {
            all: 'Alle Felder',
            PackId: 'PackId',
            ArticleId: 'ArticleId',
            PackBatchNo: 'PackBatchNo',
            PackSerialNo: 'PackSerialNo'
        };

        if (scope === 'global') {
            searchStatusElement.textContent = `Suchbegriff „${query}“ in ${labelByField[field] || 'Alle Felder'}: ${count} Treffer im gesamten Kommissionierautomaten.`;
        } else {
            searchStatusElement.textContent = `Suchbegriff „${query}“ in ${labelByField[field] || 'Alle Felder'}: ${count} Treffer in Schrank ${cabinetId}, Schublade ${drawerId}.`;
        }

        searchStatusElement.style.display = 'block';
    }

    function hideSearchStatus() {
        searchStatusElement.style.display = 'none';
        searchStatusElement.textContent = '';
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
