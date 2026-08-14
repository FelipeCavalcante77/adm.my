<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WeatherController extends Controller
{
    private const LATITUDE = -22.2964;

    private const LONGITUDE = -48.5578;

    private const LOCATION_LABEL = 'Jaú, SP';

    private const WEATHER_DESCRIPTIONS = [
        0 => ['label' => 'Céu limpo', 'icon' => 'clear'],
        1 => ['label' => 'Predominantemente limpo', 'icon' => 'partly-cloudy'],
        2 => ['label' => 'Parcialmente nublado', 'icon' => 'partly-cloudy'],
        3 => ['label' => 'Nublado', 'icon' => 'cloudy'],
        45 => ['label' => 'Neblina', 'icon' => 'fog'],
        48 => ['label' => 'Neblina com geada', 'icon' => 'fog'],
        51 => ['label' => 'Garoa fraca', 'icon' => 'rain'],
        53 => ['label' => 'Garoa moderada', 'icon' => 'rain'],
        55 => ['label' => 'Garoa forte', 'icon' => 'rain'],
        61 => ['label' => 'Chuva fraca', 'icon' => 'rain'],
        63 => ['label' => 'Chuva moderada', 'icon' => 'rain'],
        65 => ['label' => 'Chuva forte', 'icon' => 'rain'],
        71 => ['label' => 'Neve fraca', 'icon' => 'snow'],
        73 => ['label' => 'Neve moderada', 'icon' => 'snow'],
        75 => ['label' => 'Neve forte', 'icon' => 'snow'],
        80 => ['label' => 'Pancadas de chuva fracas', 'icon' => 'rain'],
        81 => ['label' => 'Pancadas de chuva moderadas', 'icon' => 'rain'],
        82 => ['label' => 'Pancadas de chuva fortes', 'icon' => 'rain'],
        95 => ['label' => 'Trovoada', 'icon' => 'storm'],
        96 => ['label' => 'Trovoada com granizo', 'icon' => 'storm'],
        99 => ['label' => 'Trovoada com granizo forte', 'icon' => 'storm'],
    ];

    public function index(): JsonResponse
    {
        $weather = Cache::remember('weather.jau', now()->addMinutes(20), function () {
            try {
                $response = Http::timeout(8)->get('https://api.open-meteo.com/v1/forecast', [
                    'latitude' => self::LATITUDE,
                    'longitude' => self::LONGITUDE,
                    'current' => 'temperature_2m,relative_humidity_2m,weather_code,is_day,wind_speed_10m',
                    'timezone' => 'America/Sao_Paulo',
                ]);

                if (! $response->successful()) {
                    return null;
                }

                $current = $response->json('current');
                $code = $current['weather_code'] ?? 0;
                $description = self::WEATHER_DESCRIPTIONS[$code] ?? ['label' => 'Tempo indefinido', 'icon' => 'cloudy'];

                return [
                    'location' => self::LOCATION_LABEL,
                    'temperature' => round($current['temperature_2m']),
                    'humidity' => round($current['relative_humidity_2m']),
                    'windSpeed' => round($current['wind_speed_10m']),
                    'isDay' => (bool) $current['is_day'],
                    'description' => $description['label'],
                    'icon' => $description['icon'],
                ];
            } catch (\Throwable $e) {
                Log::warning('Falha ao buscar previsão do tempo', ['error' => $e->getMessage()]);

                return null;
            }
        });

        return response()->json(['weather' => $weather]);
    }
}
