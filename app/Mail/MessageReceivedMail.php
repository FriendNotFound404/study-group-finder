<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class MessageReceivedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $recipientName;
    public $senderName;
    public $groupName;
    public $messagePreview;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($recipientName, $senderName, $groupName, $messagePreview)
    {
        $this->recipientName = $recipientName;
        $this->senderName = $senderName;
        $this->groupName = $groupName;
        $this->messagePreview = $messagePreview;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject("New message in {$this->groupName}")
                    ->view('emails.message-received');
    }
}
