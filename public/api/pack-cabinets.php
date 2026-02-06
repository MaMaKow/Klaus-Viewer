<?php

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

use KlausViewer\Database\DatabaseWrapper;

header('Content-Type: application/json; charset=utf-8');

$result = DatabaseWrapper::instance()->run(
    'SELECT DISTINCT `PackCabinet` FROM `Stockinginfo` ORDER BY `PackCabinet`'
);

$packCabinets = [];

while ($row = $result->fetch(PDO::FETCH_OBJ)) {
    $packCabinets[] = $row->PackCabinet;
}

echo json_encode(['packCabinets' => $packCabinets], JSON_THROW_ON_ERROR);
