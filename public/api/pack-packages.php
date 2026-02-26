<?php

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

use KlausViewer\Database\DatabaseWrapper;

header('Content-Type: application/json; charset=utf-8');

$packCabinetRaw = filter_input(INPUT_GET, 'packCabinet', FILTER_UNSAFE_RAW);
$packDrawerRaw = filter_input(INPUT_GET, 'packDrawer', FILTER_UNSAFE_RAW);
$search = filter_input(INPUT_GET, 'search', FILTER_UNSAFE_RAW);
$searchField = filter_input(INPUT_GET, 'searchField', FILTER_UNSAFE_RAW) ?: 'all';

$packCabinet = null;
$packDrawer = null;
$packCabinetInvalid = false;
$packDrawerInvalid = false;

if ($packCabinetRaw !== null && $packCabinetRaw !== '') {
    $packCabinetValue = filter_var($packCabinetRaw, FILTER_VALIDATE_INT);
    if ($packCabinetValue === false) {
        $packCabinetInvalid = true;
    } else {
        $packCabinet = (int) $packCabinetValue;
    }
}

if ($packDrawerRaw !== null && $packDrawerRaw !== '') {
    $packDrawerValue = filter_var($packDrawerRaw, FILTER_VALIDATE_INT);
    if ($packDrawerValue === false) {
        $packDrawerInvalid = true;
    } else {
        $packDrawer = (int) $packDrawerValue;
    }
}

$allowedSearchFields = ['all', 'PackId', 'ArticleId', 'PackBatchNo', 'PackSerialNo', 'Description'];
if (!in_array($searchField, $allowedSearchFields, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid searchField parameter.'], JSON_THROW_ON_ERROR);
    exit;
}

if ($packCabinetInvalid || $packDrawerInvalid) {
    http_response_code(400);
    echo json_encode(
        ['error' => 'Invalid packCabinet or packDrawer parameter.'],
        JSON_THROW_ON_ERROR
    );
    exit;
}

$hasCabinet = $packCabinet !== null;
$hasDrawer = $packDrawer !== null;

if ($hasCabinet xor $hasDrawer) {
    http_response_code(400);
    echo json_encode(
        ['error' => 'packCabinet and packDrawer must either both be set or both be omitted.'],
        JSON_THROW_ON_ERROR
    );
    exit;
}

$search = trim((string) $search);
if (!$hasCabinet && $search === '') {
    http_response_code(400);
    echo json_encode(
        ['error' => 'For a global search, the search parameter is required.'],
        JSON_THROW_ON_ERROR
    );
    exit;
}

$sql = 'SELECT `PackId`, `ArticleId`, `Description`, `PackBatchNo`, `PackSerialNo`, `PackExpiryDate`, `PackPlaceX`, `PackPlaceY`, `PackLength`, `PackWidth`, `PackHeight`, `PackDateIn`, `SnapshotTime`, `PackCabinet`, `PackDrawer`
    FROM `Stockinginfo`
    WHERE `SnapshotTime` = (
        SELECT MAX(`SnapshotTime`)
        FROM `Stockinginfo`
    )';

$params = [];

if ($hasCabinet) {
    $sql .= ' AND `PackCabinet` = :packCabinet AND `PackDrawer` = :packDrawer';
    $params['packCabinet'] = $packCabinet;
    $params['packDrawer'] = $packDrawer;
}

if ($search !== '') {
    if ($searchField === 'all') {
        $params['searchPackId'] = '%' . $search . '%';
        $params['searchArticleId'] = '%' . $search . '%';
        $params['searchPackBatchNo'] = '%' . $search . '%';
        $params['searchPackSerialNo'] = '%' . $search . '%';
        $params['searchPackName'] = '%' . $search . '%';

        $sql .= ' AND (
            CAST(`PackId` AS CHAR) LIKE :searchPackId
            OR CAST(`ArticleId` AS CHAR) LIKE :searchArticleId
            OR `PackBatchNo` LIKE :searchPackBatchNo
            OR `PackSerialNo` LIKE :searchPackSerialNo
            OR `Description` LIKE :searchPackName
        )';
    } else {
        $params['search'] = '%' . $search . '%';
        $sql .= sprintf(' AND CAST(`%s` AS CHAR) LIKE :search', $searchField);
    }
}

$sql .= ' ORDER BY `PackCabinet`, `PackDrawer`, `PackId`';

$result = DatabaseWrapper::instance()->run($sql, $params);

$packages = [];

while ($row = $result->fetch(PDO::FETCH_OBJ)) {
    $packages[] = $row;
}

echo json_encode([
    'scope' => $hasCabinet ? 'drawer' : 'global',
    'packages' => $packages,
], JSON_THROW_ON_ERROR);
