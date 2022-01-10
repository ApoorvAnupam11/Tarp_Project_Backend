var config = require("../config");

var userLoginSchema = require("../models/userDetails");
var contentSchema = require("../models/content");
var tagSchema = require("../models/tags");
var voteSchema = require("../models/votes");
var suggestionSchema = require("../models/suggestion");

exports.signupRequest = async function (req, res, next) {
    console.log("overe here");
    console.log("body = ",req.body)
    // console.log("file = ",req.files['avatar'])
    try {
        var newUser = new userLoginSchema({
            fullName: req.body.fullName,
            email: req.body.email,
            password: req.body.password,
            selfDescription: req.body.selfDescription,
            github: req.body.github,
            linkedin: req.body.linkedin,
            stackoverflow: req.body.stackoverflow,
            profileImg: req.files != null ? req.files['avatar'][0].path : null
        });
        await newUser.save();
        res.status(200).json({
            Message: "New User Added",
            Data: 1,
            IsSuccess: true
        });

    } catch (err) {
        res.status(500).json({
            Message: err.message,
            Data: 0,
            IsSuccess: false
        });
    }
}

exports.signinRequest = async function (req, res, next) {
    try {
        console.log(req.body)
        const { email, password } = req.body;
        console.log("backend data = ",email," ",password);
        var findUser = await userLoginSchema.find({email: email});
        if (findUser.length == 1) {
            if (findUser[0].password == password) // password verification
            {
                var accessToken = config.generateAccessToken({ id: findUser[0]._id });
                res.status(200).json({
                    Message: "Login Credentials Matched!",
                    Data: [{
                        userData: findUser[0],
                        accessToken: accessToken
                    }],
                    IsSuccess: true
                });
            }
            else {
                res.status(400).json({
                    Message: "Invalid Password!",
                    Data: 0,
                    IsSuccess: true
                });
            }
        } else {
            res.status(400).json({
                Message: "Invalid Login Credentials!",
                Data: 0,
                IsSuccess: true
            });
        }
    } catch (err) {
        res.status(500).json({
            Message: err.message,
            Data: 0,
            IsSuccess: false
        });
    }
}

exports.userProfile = async function (req, res, next) {
    try {
        var userData = await userLoginSchema.find({ _id: req.token.id });
        if (userData.length == 1) {
            res.status(200).json({
                Message: "Data Sent",
                Data: userData[0],
                IsSuccess: true
            });
        }
        else {
            res.status(400).json({
                Message: "Invalid User Credentials!",
                Data: 0,
                IsSuccess: true
            });
        }

    } catch (err) {
        res.status(500).json({
            Message: err.message,
            Data: 0,
            IsSuccess: false
        });
    }
}

exports.suggestion = async function (req, res, next) {
    try {
        // console.log(req.body);
        var userData = await userLoginSchema.find({ _id: req.token.id });
        if (userData.length == 1) {
            if (req.body != null) {
                const { title, link, description, type, tags, language, category, courseDate } = req.body;
                var newContent = new contentSchema({
                    title: title,
                    link: link,
                    description: description,
                    type: type.toLowerCase(), // paid or unpaid: yes or no
                    language: language.toLowerCase(),
                    category: category,
                    courseDate: courseDate
                });
                await newContent.save();

                var data = await contentSchema.find({ link: link });
                var newSuggestion = new suggestionSchema({
                    contentId: data[0]._id,
                    userId: userData[0]._id
                });
                await newSuggestion.save();

                var tmp = tags.split(", ");
                var i;
                for (i = 0; i < tmp.length; i++) {
                    var newTags = new tagSchema({
                        name: tmp[i].toLowerCase(),
                        contentId: data[0]._id
                    });
                    await newTags.save();
                    if (i == 0) {
                        var newTags = new tagSchema({
                            name: (data[0].title).toLowerCase(),
                            contentsId: data[0]._id
                        });
                        await newTags.save();
                    }
                }
                res.status(200).json({
                    Message: "New Content Added",
                    Data: 1,
                    IsSuccess: true
                });
            }
            else {
                res.status(400).json({
                    Message: "Data not found!",
                    Data: 0,
                    IsSuccess: true
                });
            }
        }
        else {
            res.status(400).json({
                Message: "Invalid User Credentials!",
                Data: 0,
                IsSuccess: true
            });
        }

    } catch (err) {
        res.status(500).json({
            Message: err.message,
            Data: 0,
            IsSuccess: false
        });
    }
}

// bydefault type and language will be null and status will be true from front end.. else all must be in lowercase from frontend (user input could be anything)
exports.contentListing = async function (req, res, next) {
    try {
        // tag, language, type (yes or no)
        console.log(req.body);
        var userData = await userLoginSchema.find({ _id: req.token.id });
        if (userData.length == 1) {
            if (req.body != null) {
                var x = (req.body.tag).toLowerCase();
                var data = await tagSchema.find({ name: x });

                var contents = [];
                var i;
                if (req.body.language) {
                    for (i = 0; i < data.length; i++) {
                        var tmp = await contentSchema.find({ _id: data[i].contentId, language: req.body.language, type: req.body.type });
                        if (tmp.length == 1) {
                            contents.push(tmp[0]);
                        }
                    }
                    if(data.length==0)
                    {
                        contents = await contentSchema.find({language: req.body.language, type: req.body.type});
                    }
                }
                else {
                    for (i = 0; i < data.length; i++) {
                        var tmp = await contentSchema.find({ _id: data[i].contentId, type: req.body.type });
                        if (tmp.length == 1) {
                            contents.push(tmp[0]);
                        }
                    }
                    if(data.length==0)
                    {
                        contents = await contentSchema.find({type: req.body.type});
                    }
                }

                function GetSortOrder(prop1, prop2) {    
                    return function(a, b) {    
                        if(a[prop2]==0)
                        {
                            a[prop2]=1;
                        }
                        if(b[prop2]==0)
                        {
                            b[prop2]=1;
                        }
                        if (a[prop1]/a[prop2] > b[prop1]/b[prop2]) {    
                            return 1;    
                        }
                        return 0;    
                    }    
                }
                contents.sort(GetSortOrder("upvotes","downvotes"));


                res.status(200).json({
                    Message: "Data Sent",
                    Data: contents,
                    IsSuccess: true
                });
            }
            else {
                res.status(400).json({
                    Message: "Data not found!",
                    Data: 0,
                    IsSuccess: true
                });
            }
        }
        else {
            res.status(400).json({
                Message: "Invalid User Credentials!",
                Data: 0,
                IsSuccess: true
            });
        }

    } catch (err) {
        res.status(500).json({
            Message: err.message,
            Data: 0,
            IsSuccess: false
        });
    }
}

exports.contentVote = async function (req, res, next) {
    try {
        var userData = await userLoginSchema.find({ _id: req.token.id });
        if (userData.length == 1) {
            if (req.body != null) {
                const { contentId, vote } = req.body;
                var data = await voteSchema.find({ contentId: contentId, userId: req.token.id });

                var content = await contentSchema.find({ _id: contentId });
                let upvotes = content[0].upvotes;
                let downvotes = content[0].downvotes;

                if (vote == "upvote" && data[0] == null) {

                    var newVote = new voteSchema({
                        upvote: true,
                        downvote: false,
                        contentId: contentId,
                        userId: req.token.id
                    });
                    await newVote.save();

                    let updateVal = await contentSchema.findByIdAndUpdate(contentId, {
                        upvotes: upvotes + 1
                    }, { new: true });

                }
                else if (vote == "downvote" && data[0] == null) {

                    var newVote = new voteSchema({
                        upvote: false,
                        downvote: true,
                        contentId: contentId,
                        userId: req.token.id
                    });
                    await newVote.save();

                    let updateVal = await contentSchema.findByIdAndUpdate(contentId, {
                        downvotes: downvotes + 1
                    }, { new: true });

                }
                else if (vote == "upvote" && data[0].downvote == true) {

                    let updateData = await voteSchema.findByIdAndUpdate(data[0]._id, {
                        upvote: true, downvote: false
                    }, { new: true });

                    let updateVal = await contentSchema.findByIdAndUpdate(contentId, {
                        upvotes: upvotes + 1, downvotes: downvotes - 1
                    }, { new: true });

                }
                else if (vote == "downvote" && data[0].upvote == true) {

                    let updateData = await voteSchema.findByIdAndUpdate(data[0]._id, {
                        upvote: false, downvote: true
                    }, { new: true });

                    let updateVal = await contentSchema.findByIdAndUpdate(contentId, {
                        upvotes: upvotes - 1, downvotes: downvotes + 1
                    }, { new: true });

                }

                var updatedVal = await contentSchema.find({ _id: contentId });
                res.status(200).json({
                    Message: "Voting Done!",
                    Data: updatedVal[0],
                    IsSuccess: true
                });
            }
            else {
                res.status(400).json({
                    Message: "Data not found!",
                    Data: 0,
                    IsSuccess: true
                });
            }
        }
        else {
            res.status(400).json({
                Message: "Invalid User Credentials!",
                Data: 0,
                IsSuccess: true
            });
        }

    } catch (err) {
        res.status(500).json({
            Message: err.message,
            Data: 0,
            IsSuccess: false
        });
    }
}

