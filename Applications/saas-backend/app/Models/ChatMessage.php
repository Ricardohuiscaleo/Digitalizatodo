<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    protected $fillable = ['session_id', 'sender', 'type', 'message', 'file_path', 'telegram_message_id'];
}
