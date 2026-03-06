<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TelegramConversation extends Model
{
    protected $fillable = ['chat_id', 'message_id', 'from_email', 'subject'];
}