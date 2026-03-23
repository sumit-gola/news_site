@component('mail::message')
# New Article Published

**{{ $article->title }}**

@if($article->featured_image_url)
![Featured Image]({{ $article->featured_image_url }})
@endif

{{ $article->excerpt }}

@component('mail::button', ['url' => route('news.show', $article->slug), 'color' => 'red'])
Read Full Article
@endcomponent

---

*You are receiving this because you subscribed to {{ config('app.name') }} newsletter.*

[Unsubscribe]({{ $unsubscribeUrl }})

@endcomponent
