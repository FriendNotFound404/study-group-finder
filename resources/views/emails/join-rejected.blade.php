<x-mail::message>
# Request Update

Hello {{ $userName }},

Unfortunately, your request to join **"{{ $groupName }}"** was not approved at this time.

The group leader may have capacity constraints or specific requirements. Feel free to explore other study groups that might be a good fit!

<x-mail::button :url="config('app.url')">
Browse Other Groups
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
