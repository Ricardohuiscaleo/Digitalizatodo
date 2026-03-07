<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Tenant;
use App\Models\User;

class TenantRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_register_a_new_tenant_and_owner()
    {
        $data = [
            'tenant_name' => 'Dojo Test',
            'tenant_slug' => 'dojo-test',
            'industry' => 'academy',
            'user_name' => 'Test Owner',
            'email' => 'owner@test.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->postJson('/api/register-tenant', $data);

        $response->assertStatus(201)
            ->assertJsonStructure([
            'message',
            'tenant',
            'user',
            'admin_url',
            'instructions'
        ]);

        $this->assertDatabaseHas('tenants', [
            'id' => 'dojo-test',
            'name' => 'Dojo Test',
            'industry' => 'academy',
        ]);

        $this->assertDatabaseHas('users', [
            'name' => 'Test Owner',
            'email' => 'owner@test.com',
            'tenant_id' => 'dojo-test',
        ]);
    }

    public function test_cannot_register_tenant_with_existing_slug()
    {
        Tenant::create([
            'id' => 'existing-slug',
            'name' => 'Existing',
            'industry' => 'academy',
            'active' => true,
        ]);

        $data = [
            'tenant_name' => 'New Dojo',
            'tenant_slug' => 'existing-slug',
            'industry' => 'academy',
            'user_name' => 'New Owner',
            'email' => 'new@owner.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->postJson('/api/register-tenant', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['tenant_slug']);
    }

    public function test_cannot_register_user_with_existing_email()
    {
        User::factory()->create(['email' => 'duplicate@test.com']);

        $data = [
            'tenant_name' => 'New Dojo',
            'tenant_slug' => 'new-slug',
            'industry' => 'academy',
            'user_name' => 'New Owner',
            'email' => 'duplicate@test.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->postJson('/api/register-tenant', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }
}
