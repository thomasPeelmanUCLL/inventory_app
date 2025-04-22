/*import { Comment } from "../../../model/comment";
import { User } from "../../../model/user";
import { Setup } from "../../../model/setup";

test('given: valid values, when: creating comment, then: comment is created with those values', () => {

    const valid_user = new User({id: 1, name: "John Doe", email: "johndoe@gmail.com", password: "password", role:"user", age: 25});

    const valid_setup = new Setup({
        owner: valid_user,
        details: "This is a setup",
        image_urls: [],
        last_updated: new Date(),
        hardware_components: [],
        setup_id: 1
    });
    
    const valid_comment = new Comment({
        comment_id: 1,
        setup_id: valid_setup.getSetupID(),
        user_id: valid_user.getId()!,
        content: "This is a comment"
    });

    expect(valid_comment.getCommentID()).toEqual(1);
    expect(valid_comment.getSetupID()).toEqual(1);
    expect(valid_comment.getUserID()).toEqual(1);
    expect(valid_comment.getContent()).toEqual("This is a comment");
});

test('given: valid values, when: changing content, then: content is changed', () => {
    
    const valid_user = new User({id: 1, name: "John Doe", email: "johndoe@gmail.com", password: "password", role:"user", age: 25});

    const valid_setup = new Setup({
        owner: valid_user,
        details: "This is a setup",
        image_urls: [],
        last_updated: new Date(),
        hardware_components: [],
        setup_id: 1
    });

    const valid_comment = new Comment({
        comment_id: 1,
        setup_id: valid_setup.getSetupID(),
        user_id: valid_user.getId()!,
        content: "This is a comment"
    });

    valid_comment.setContent("This is an updated comment");

    expect(valid_comment.getContent()).toEqual("This is an updated comment");
});*/
