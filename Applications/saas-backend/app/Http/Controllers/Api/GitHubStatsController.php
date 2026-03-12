<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class GitHubStatsController extends Controller
{
    private $repositories = [
        'Ricardohuiscaleo/Digitalizatodo',
        'Ricardohuiscaleo/saas-backend',
        'Ricardohuiscaleo/laruta11_3',
        'Ricardohuiscaleo/matemagica2',
        'Ricardohuiscaleo/ruta11-food-truck-app',
        'Ricardohuiscaleo/laruta11',
        'Ricardohuiscaleo/angel-volkers',
        'Ricardohuiscaleo/agente-rag-website',
        'Ricardohuiscaleo/AGR',
        'Ricardohuiscaleo/esilovepdf',
        'Ricardohuiscaleo/ilovepdf',
        'Ricardohuiscaleo/Matemagica'
    ];

    public function index()
    {
        return Cache::remember('github_stats', 86400, function () {
            $totalStars = 0;
            $languages = [];
            $repoCount = count($this->repositories);
            
            foreach ($this->repositories as $repo) {
                try {
                    // Fetch Repo Info
                    $repoResponse = Http::withHeaders([
                        'User-Agent' => 'Laravel-DigitalizaTodo'
                    ])->get("https://api.github.com/repos/{$repo}");
                    
                    if ($repoResponse->successful()) {
                        $totalStars += $repoResponse->json('stargazers_count', 0);
                    }

                    // Fetch Languages
                    $langResponse = Http::withHeaders([
                        'User-Agent' => 'Laravel-DigitalizaTodo'
                    ])->get("https://api.github.com/repos/{$repo}/languages");

                    if ($langResponse->successful()) {
                        foreach ($langResponse->json() as $lang => $bytes) {
                            if (!isset($languages[$lang])) {
                                $languages[$lang] = 0;
                            }
                            $languages[$lang] += $bytes;
                        }
                    }
                } catch (\Exception $e) {
                    \Log::error("Error fetching GitHub data for {$repo}: " . $e->getMessage());
                }
            }

            // Calculate Percentages for top 5 languages
            arsort($languages);
            $totalBytes = array_sum($languages);
            $topLanguages = [];
            $count = 0;
            foreach ($languages as $lang => $bytes) {
                if ($count >= 5) break;
                $topLanguages[] = [
                    'name' => $lang,
                    'percentage' => $totalBytes > 0 ? round(($bytes / $totalBytes) * 100, 1) : 0
                ];
                $count++;
            }

            return [
                'total_repositories' => 12, // User specified 12 active repos
                'total_stars' => $totalStars,
                'top_languages' => $topLanguages,
                'modules_count' => 221 + ($repoCount * 5),
                'clean_code_rating' => 86, // User specified Carbon API 86%
                'seo_score' => 98, // User specified Google API 98/100
                'pagespeed_score' => 95, // User specified PageSpeed API 95/100
            ];
        });
    }
}
