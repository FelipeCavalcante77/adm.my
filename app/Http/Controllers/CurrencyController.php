<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CurrencyController extends Controller
{
    private const PAIRS = [
        'USD-BRL' => 'Dólar Americano',
        'EUR-BRL' => 'Euro',
        'BTC-BRL' => 'Bitcoin',
    ];

    public function index(): JsonResponse
    {
        $rates = Cache::remember('currency.rates', now()->addMinutes(10), function () {
            try {
                $response = Http::timeout(8)->get(
                    'https://economia.awesomeapi.com.br/last/'.implode(',', array_keys(self::PAIRS))
                );

                if (! $response->successful()) {
                    return [];
                }

                $data = $response->json();
                $rates = [];

                foreach (self::PAIRS as $pair => $label) {
                    $key = str_replace('-', '', $pair);
                    $item = $data[$key] ?? null;

                    if (! $item) {
                        continue;
                    }

                    $rates[] = [
                        'code' => $item['code'],
                        'label' => $label,
                        'bid' => round((float) $item['bid'], 2),
                        'pctChange' => round((float) $item['pctChange'], 2),
                    ];
                }

                return $rates;
            } catch (\Throwable $e) {
                Log::warning('Falha ao buscar cotação de moedas', ['error' => $e->getMessage()]);

                return [];
            }
        });

        return response()->json(['rates' => $rates]);
    }
}
