import express from 'express';
import protect from '../middleware/authMiddleware.js';
import Post from '../models/postModel.js';
import User from '../models/userModel.js';

const router = express.Router();

// @route   GET /api/posts
// @desc    Get all posts
router.get('/', protect, async (req, res) => {
    try {
        const posts = await Post.find({})
            // .populate('user', 'name username avatarUrl')
            // .populate('comments.user', 'name username avatarUrl')
            .sort({ createdAt: -1 });
            
        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/posts
// @desc    Create a new post
router.post('/', protect, async (req, res) => {
    const { content, imageUrl } = req.body;

    if (!content && !imageUrl) {
        return res.status(400).json({ message: 'Post must have content or an image' });
    }

    try {
        const post = new Post({
            content,
            imageUrl: imageUrl || null,
            user: req.user.id,
        });

        const createdPost = await post.save();
        // const populatedPost = await Post.findById(createdPost._id).populate('user', 'name username avatarUrl');
        res.status(201).json(createdPost);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
router.delete('/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check user
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await post.deleteOne();

        res.json({ message: 'Post removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});


// @route   PUT /api/posts/:id/like
// @desc    Like or unlike a post
router.put('/:id/like', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.likes.some(like => like.equals(req.user.id))) {
            // Unlike
            post.likes = post.likes.filter(
                like => !like.equals(req.user.id)
            );
        } else {
            // Like
            post.likes.push(req.user.id);
        }

        await post.save();
        // const populatedPost = await Post.findById(post._id)
        //     .populate('user', 'name username avatarUrl')
        //     .populate('comments.user', 'name username avatarUrl');

        res.json(post);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/posts/:id/comments
// @desc    Comment on a post
router.post('/:id/comments', protect, async (req, res) => {
    const { text } = req.body;
     if (!text) {
        return res.status(400).json({ message: 'Comment text is required' });
    }
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const newComment = {
            text: text,
            user: req.user.id,
        };

        post.comments.push(newComment);

        await post.save();
        // const populatedPost = await Post.findById(post._id)
        //     .populate('user', 'name username avatarUrl')
        //     .populate('comments.user', 'name username avatarUrl');

        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   DELETE /api/posts/:id/comments/:comment_id
// @desc    Delete a comment
router.delete('/:id/comments/:comment_id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const comment = post.comments.find(
            comment => comment._id.toString() === req.params.comment_id
        );

        if (!comment) {
            return res.status(404).json({ message: 'Comment does not exist' });
        }

        if (comment.user.toString() !== req.user.id && post.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        post.comments = post.comments.filter(
            ({ _id }) => _id.toString() !== req.params.comment_id
        );

        await post.save();
        
        // const populatedPost = await Post.findById(post._id)
        //     .populate('user', 'name username avatarUrl')
        //     .populate('comments.user', 'name username avatarUrl');

        res.json(post);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
