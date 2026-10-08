<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'item_description' => 'required|string|max:255',
            'category'      =>'required|string|max:100',
            'location_found'   => 'required|string|max:255',
            'contact_info'     => 'required|string|max:255',
            'status' => 'required'
        ];
    }
}
