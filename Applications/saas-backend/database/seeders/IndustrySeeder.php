<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class IndustrySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $industries = [
            ['id' => 'academy', 'name' => 'Artes Marciales - Deportes', 'active' => true],
            ['id' => 'clinic', 'name' => 'Salud - Estética', 'active' => true],
            ['id' => 'other', 'name' => 'Otros Negocios', 'active' => true],
        ];

        foreach ($industries as $industry) {
            \App\Models\Industry::updateOrCreate(['id' => $industry['id']], $industry);
        }
    }
}
