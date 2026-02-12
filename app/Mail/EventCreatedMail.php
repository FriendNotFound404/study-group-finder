<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class EventCreatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $userName;
    public $groupName;
    public $eventTitle;
    public $eventTime;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($userName, $groupName, $eventTitle, $eventTime)
    {
        $this->userName = $userName;
        $this->groupName = $groupName;
        $this->eventTitle = $eventTitle;
        $this->eventTime = $eventTime;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject("New Meeting: {$this->eventTitle}")
                    ->view('emails.event-created');
    }
}
