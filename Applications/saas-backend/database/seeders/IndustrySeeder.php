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
            ['id' => 'martial_arts', 'name' => 'Artes Marciales - Boxeo - Dojo', 'active' => true],
            ['id' => 'fitness', 'name' => 'Gimnasios - Crossfit - Yoga', 'active' => true],
            ['id' => 'dance', 'name' => 'Academias de Danza - Ballet', 'active' => true],
            ['id' => 'music', 'name' => 'Escuelas de Música - Canto', 'active' => true],
            ['id' => 'clinic', 'name' => 'Centros de Salud - Estética', 'active' => true],
            ['id' => 'education', 'name' => 'Centros de Educación - Talleres', 'active' => true],
            ['id' => 'default', 'name' => 'Otros Servicios Profesionales', 'active' => true],
        ];

        foreach ($industries as $industry) {
            \App\Models\Industry::updateOrCreate(['id' => $industry['id']], $industry);
        }
    }
}
