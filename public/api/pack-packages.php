<?php

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

use KlausViewer\Database\DatabaseWrapper;

header('Content-Type: application/json; charset=utf-8');

$packCabinet = filter_input(INPUT_GET, 'packCabinet', FILTER_VALIDATE_INT);
$packDrawer = filter_input(INPUT_GET, 'packDrawer', FILTER_VALIDATE_INT);

if ($packCabinet === null || $packCabinet === false || $packDrawer === null || $packDrawer === false) {
    http_response_code(400);
    echo json_encode(
        ['error' => 'Missing or invalid packCabinet or packDrawer parameter.'],
        JSON_THROW_ON_ERROR
    );
    exit;
}

$result = DatabaseWrapper::instance()->run(
    'SELECT `PackId`, `ArticleId`, `Description`, `PackBatchNo`, `PackSerialNo`, `PackExpiryDate`, `PackPlaceX`, `PackPlaceY`, `PackLength`, `PackWidth`, `PackHeight`, `PackDateIn`, `SnapshotTime`, `PackCabinet`, `PackDrawer`
        FROM `Stockinginfo`
        WHERE `PackCabinet` = :packCabinet
            AND `PackDrawer` = :packDrawer
            AND `SnapshotTime` = (
                SELECT MAX(`SnapshotTime`)
                FROM `Stockinginfo`
                WHERE `PackCabinet` = :packCabinet
                    AND `PackDrawer` = :packDrawer
            )
        ORDER BY `PackId`',
    [
        'packCabinet' => $packCabinet,
        'packDrawer' => $packDrawer,
    ]
);

$packages = [];

while ($row = $result->fetch(PDO::FETCH_OBJ)) {
    $packages[] = $row;
}

echo json_encode(['packages' => $packages], JSON_THROW_ON_ERROR);
