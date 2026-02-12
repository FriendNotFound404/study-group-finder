<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class EventReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public $userName;
    public $groupName;
    public $eventTitle;
    public $eventTime;
    public $eventLocation;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($userName, $groupName, $eventTitle, $eventTime, $eventLocation = null)
    {
        $this->userName = $userName;
        $this->groupName = $groupName;
        $this->eventTitle = $eventTitle;
        $this->eventTime = $eventTime;
        $this->eventLocation = $eventLocation;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject("Reminder: {$this->eventTitle} Tomorrow")
                    ->view('emails.event-reminder');
    }
}
