<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    public function index()
    {
        return response()->json(Item::latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'location' => 'required|string|max:255',
            'contact'  => 'required|string|max:255',
        ]);

        $item = Item::create([
            ...$validated,
            'status' => 'Unclaimed',
        ]);

        return response()->json($item, 201);
    }

    public function show(Item $item)
    {
        return response()->json($item);
    }

    public function update(Request $request, Item $item)
    {
        $validated = $request->validate([
            'name'     => 'sometimes|required|string|max:255',
            'category' => 'sometimes|required|string|max:100',
            'location' => 'sometimes|required|string|max:255',
            'contact'  => 'sometimes|required|string|max:255',
            'status'   => 'sometimes|required|in:Unclaimed,Claimed',
        ]);

        $item->update($validated);

        return response()->json($item);
    }

    public function destroy(Item $item)
    {
        $item->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}