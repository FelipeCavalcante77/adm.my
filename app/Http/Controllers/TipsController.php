<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TipsController extends Controller
{
    private const MANAGEMENT_TIPS = [
        'Bloqueie 2h por dia sem reuniões para trabalho profundo — produtividade cai muito com contexto fragmentado.',
        'Delegue o resultado, não o método. Diga o "o quê" e o "porquê"; deixe a equipe decidir o "como".',
        'Toda reunião precisa de uma pauta e um dono. Sem isso, cancele.',
        'Feedback vale mais frequente e pequeno do que raro e grande. Não espere a avaliação anual.',
        'Priorize por impacto x esforço, não por quem pediu mais alto.',
        'Documente decisões, não só tarefas — o "porquê" evita retrabalho meses depois.',
        'Um "não" claro agora é mais barato que um "talvez" que consome semanas de expectativa.',
        'Meça o que importa: menos KPIs, mais acionáveis.',
        'Onboarding bom é o maior multiplicador de produtividade de um time pequeno.',
        'Revise processos a cada trimestre — o que funcionava com 3 pessoas trava com 10.',
        'Dívida técnica é como dívida financeira: parcelas pequenas e constantes, não uma bola de neve.',
        'Celebre pequenas entregas. Motivação também é combustível de gestão.',
        'Escreva a decisão antes de discuti-la em grupo — reduz viés de quem fala primeiro.',
        'Peça para o time explicar o problema antes de propor a solução — evita resolver o sintoma errado.',
        'Contrate por trajetória de aprendizado, não só por currículo atual.',
        'Reduza o número de ferramentas antes de adicionar mais uma — cada nova ferramenta tem custo de atenção.',
        'Toda meta precisa de um dono único, mesmo que a execução seja em equipe.',
        'Transparência sobre números financeiros básicos aumenta o senso de dono no time.',
        'Antes de escalar um processo, valide manualmente algumas vezes.',
        'Peça feedback sobre a sua própria gestão — a maioria dos gestores nunca pergunta isso.',
    ];

    public function index(): JsonResponse
    {
        $techNews = Cache::remember('tips.tech_news', now()->addHours(3), function () {
            return $this->fetchTechNews();
        });

        $dayOfYear = (int) now()->format('z');
        $managementTip = self::MANAGEMENT_TIPS[$dayOfYear % count(self::MANAGEMENT_TIPS)];

        return response()->json([
            'techNews' => $techNews,
            'managementTip' => $managementTip,
        ]);
    }

    private function fetchTechNews(): array
    {
        $tags = ['ai', 'security', 'productivity'];
        $articles = [];

        foreach ($tags as $tag) {
            try {
                $response = Http::timeout(4)
                    ->withUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
                    ->get('https://dev.to/api/articles', [
                        'tag' => $tag,
                        'per_page' => 3,
                        'top' => 7,
                    ]);

                if (! $response->successful()) {
                    continue;
                }

                foreach ($response->json() as $article) {
                    $articles[] = [
                        'id' => $article['id'],
                        'title' => $article['title'],
                        'url' => $article['url'],
                        'tag' => $tag,
                        'source' => $article['user']['name'] ?? 'dev.to',
                        'published_at' => $article['published_at'],
                    ];
                }
            } catch (\Throwable $e) {
                Log::warning('Falha ao buscar tips.tech_news', ['tag' => $tag, 'error' => $e->getMessage()]);
            }
        }

        usort($articles, fn ($a, $b) => strcmp($b['published_at'], $a['published_at']));

        $seen = [];
        $unique = [];
        foreach ($articles as $article) {
            if (isset($seen[$article['id']])) {
                continue;
            }
            $seen[$article['id']] = true;
            $unique[] = $article;
        }

        return array_slice($unique, 0, 6);
    }
}
