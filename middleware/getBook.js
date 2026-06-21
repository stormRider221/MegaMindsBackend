const Book = require("../models/Book");

const getBook = async (req, res, next) => {
  try {
    const bookId = req.params.id;

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        message: "Book not found"
      });
    }

    // 👉 Attach book to request
    req.resource = book;

    next();

  } catch (error) {
    console.error("Get Book Error:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
};

module.exports = getBook;